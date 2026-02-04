import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ML_APP_ID = Deno.env.get('ML_APP_ID')!;
const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Mercado Livre OAuth URLs
const ML_AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_USER_URL = 'https://api.mercadolibre.com/users/me';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    
    // For POST requests, also check the body for action
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
        if (!action && body.action) {
          action = body.action as string;
        }
      } catch {
        // Body might be empty for some requests
      }
    }

    // Get authorization URL for OAuth flow
    if (action === 'get_auth_url') {
      const redirectUri = url.searchParams.get('redirect_uri');
      
      if (!redirectUri) {
        return new Response(
          JSON.stringify({ error: 'redirect_uri is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authUrl = `${ML_AUTH_URL}?response_type=code&client_id=${ML_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      console.log('Generated ML auth URL:', authUrl);
      
      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange authorization code for tokens
    if (action === 'exchange_code') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Verify user token
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
      
      if (claimsError || !claimsData.user) {
        console.error('Auth error:', claimsError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = claimsData.user.id;
      const { code, redirect_uri } = body as { code?: string; redirect_uri?: string };

      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: 'code and redirect_uri are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Exchanging code for tokens...');

      // Exchange code for tokens
      const tokenResponse = await fetch(ML_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: ML_APP_ID,
          client_secret: ML_CLIENT_SECRET,
          code,
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to exchange code', details: errorText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful, fetching user info...');

      // Get ML user info
      const userResponse = await fetch(ML_USER_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userResponse.ok) {
        console.error('Failed to fetch ML user info');
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user info' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const mlUser = await userResponse.json();
      console.log('ML user info:', mlUser.id, mlUser.nickname);

      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('marketplace_accounts')
        .select('id')
        .eq('marketplace', 'mercadolivre')
        .eq('nome_conta', mlUser.nickname)
        .single();

      if (existingAccount) {
        // Update existing account
        const { error: updateError } = await supabase
          .from('marketplace_accounts')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAccount.id);

        if (updateError) {
          console.error('Failed to update account:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Updated existing account:', existingAccount.id);
        return new Response(
          JSON.stringify({ success: true, account_id: existingAccount.id, nickname: mlUser.nickname }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create new account
      const { data: newAccount, error: insertError } = await supabase
        .from('marketplace_accounts')
        .insert({
          user_id: userId,
          marketplace: 'mercadolivre',
          nome_conta: mlUser.nickname,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          status: 'active',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to create account:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Created new account:', newAccount.id);
      return new Response(
        JSON.stringify({ success: true, account_id: newAccount.id, nickname: mlUser.nickname }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh access token
    if (action === 'refresh_token') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { account_id } = body as { account_id?: string };

      // Get account refresh token
      const { data: account, error: accountError } = await supabase
        .from('marketplace_accounts')
        .select('refresh_token')
        .eq('id', account_id)
        .single();

      if (accountError || !account?.refresh_token) {
        return new Response(
          JSON.stringify({ error: 'Account not found or no refresh token' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Refresh token
      const tokenResponse = await fetch(ML_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: ML_APP_ID,
          client_secret: ML_CLIENT_SECRET,
          refresh_token: account.refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Token refresh failed');
        await supabase
          .from('marketplace_accounts')
          .update({ status: 'error' })
          .eq('id', account_id);
          
        return new Response(
          JSON.stringify({ error: 'Failed to refresh token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();

      // Update tokens
      await supabase
        .from('marketplace_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', account_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ml-oauth:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
