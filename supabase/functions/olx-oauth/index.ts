import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const OLX_CLIENT_ID = Deno.env.get('OLX_CLIENT_ID')!;
const OLX_CLIENT_SECRET = Deno.env.get('OLX_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// OLX OAuth URLs
const OLX_AUTH_URL = 'https://auth.olx.com.br/oauth/authorize';
const OLX_TOKEN_URL = 'https://auth.olx.com.br/oauth/token';
const OLX_USER_URL = 'https://apps.olx.com.br/autoupload/v1/account';

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

      // OLX uses standard OAuth2 authorization code flow
      const scopes = 'basic_user_info autoupload';
      const authUrl = `${OLX_AUTH_URL}?response_type=code&client_id=${OLX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
      
      console.log('Generated OLX auth URL:', authUrl);
      
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

      console.log('Exchanging OLX code for tokens...');

      // Exchange code for tokens using Basic Auth
      const credentials = btoa(`${OLX_CLIENT_ID}:${OLX_CLIENT_SECRET}`);
      const tokenResponse = await fetch(OLX_TOKEN_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('OLX Token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to exchange code', details: errorText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();
      console.log('OLX Token exchange successful. Has refresh_token:', !!tokenData.refresh_token);
      console.log('Fetching OLX user info...');

      // Get OLX user info
      const userResponse = await fetch(OLX_USER_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      let accountName = `OLX-${Date.now()}`;
      
      if (userResponse.ok) {
        const olxUser = await userResponse.json();
        console.log('OLX user info:', olxUser);
        accountName = olxUser.email || olxUser.name || accountName;
      } else {
        console.warn('Failed to fetch OLX user info, using default name');
      }

      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('marketplace_accounts')
        .select('id')
        .eq('marketplace', 'olx')
        .eq('nome_conta', accountName)
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
          console.error('Failed to update OLX account:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Updated existing OLX account:', existingAccount.id);
        return new Response(
          JSON.stringify({ success: true, account_id: existingAccount.id, nome_conta: accountName }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create new account
      const { data: newAccount, error: insertError } = await supabase
        .from('marketplace_accounts')
        .insert({
          user_id: userId,
          marketplace: 'olx',
          nome_conta: accountName,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          status: 'active',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to create OLX account:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Created new OLX account:', newAccount.id);
      return new Response(
        JSON.stringify({ success: true, account_id: newAccount.id, nome_conta: accountName }),
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

      // Refresh token using Basic Auth
      const credentials = btoa(`${OLX_CLIENT_ID}:${OLX_CLIENT_SECRET}`);
      const tokenResponse = await fetch(OLX_TOKEN_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('OLX Token refresh failed');
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
          refresh_token: tokenData.refresh_token || account.refresh_token,
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
    console.error('Error in olx-oauth:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
