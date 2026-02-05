import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ML_API_URL = 'https://api.mercadolibre.com';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_APP_ID = Deno.env.get('ML_APP_ID')!;
const ML_CLIENT_SECRET = Deno.env.get('ML_CLIENT_SECRET')!;

async function refreshAccessToken(supabase: any, accountId: string, refreshToken: string): Promise<string | null> {
  console.log('Refreshing access token for account:', accountId);
  
  try {
    const tokenResponse = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ML_APP_ID,
        client_secret: ML_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token refresh failed:', await tokenResponse.text());
      return null;
    }

    const tokenData = await tokenResponse.json();
    
    await (supabase as any)
      .from('marketplace_accounts')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    console.log('Token refreshed successfully');
    return tokenData.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { listingId } = await req.json();
    
    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'listingId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching pictures for listing:', listingId);

    // Get the listing with external_id and account info
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select('external_id, marketplace_account_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      console.error('Listing not found:', listingError);
      return new Response(
        JSON.stringify({ error: 'Listing not found', pictures: [] }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!listing.external_id) {
      console.log('Listing has no external_id');
      return new Response(
        JSON.stringify({ pictures: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the marketplace account for access token
    const { data: account, error: accountError } = await supabase
      .from('marketplace_accounts')
      .select('access_token, refresh_token, id')
      .eq('id', listing.marketplace_account_id)
      .single();

    if (accountError || !account) {
      console.error('Account not found:', accountError);
      return new Response(
        JSON.stringify({ error: 'Account not found', pictures: [] }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let accessToken = account.access_token;

    // Fetch item details from ML API
    console.log('Fetching ML item:', listing.external_id);
    let response = await fetch(`${ML_API_URL}/items/${listing.external_id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // If unauthorized, try refreshing the token
    if (response.status === 401 && account.refresh_token) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshAccessToken(supabase, account.id, account.refresh_token);
      
      if (accessToken) {
        response = await fetch(`${ML_API_URL}/items/${listing.external_id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ML API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch item from ML', pictures: [] }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const item = await response.json();
    
    // Extract pictures
    const pictures = item.pictures?.map((pic: any) => ({
      id: pic.id,
      url: pic.secure_url || pic.url,
      size: pic.size,
      maxSize: pic.max_size,
    })) || [];

    console.log(`Found ${pictures.length} pictures for item ${listing.external_id}`);

    return new Response(
      JSON.stringify({ pictures }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching item pictures:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error', pictures: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
