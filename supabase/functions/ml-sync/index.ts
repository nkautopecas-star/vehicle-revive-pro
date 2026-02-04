import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ML_API_URL = 'https://api.mercadolibre.com';

// Helper to make authenticated ML API calls
async function mlApiCall(endpoint: string, accessToken: string, options: RequestInit = {}) {
  const response = await fetch(`${ML_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ML API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, account_id, part_id, listing_data } = body;

    // Get account with access token
    const { data: account, error: accountError } = await supabase
      .from('marketplace_accounts')
      .select('*')
      .eq('id', account_id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = account.access_token;

    // Create listing from part
    if (action === 'create_listing') {
      console.log('Creating listing for part:', part_id);

      // Get part details
      const { data: part, error: partError } = await supabase
        .from('parts')
        .select(`
          *,
          part_images(file_path, order_position),
          part_compatibilities(marca, modelo, ano_inicio, ano_fim),
          vehicles(marca, modelo, ano)
        `)
        .eq('id', part_id)
        .single();

      if (partError || !part) {
        return new Response(
          JSON.stringify({ error: 'Part not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build title with compatibility info
      let title = part.nome;
      if (part.vehicles) {
        title = `${part.nome} ${part.vehicles.marca} ${part.vehicles.modelo} ${part.vehicles.ano}`;
      } else if (part.part_compatibilities?.length > 0) {
        const compat = part.part_compatibilities[0];
        title = `${part.nome} ${compat.marca} ${compat.modelo}`;
      }
      title = title.substring(0, 60); // ML title limit

      // Build description
      let description = `${part.nome}\n\n`;
      if (part.codigo_oem) description += `Código OEM: ${part.codigo_oem}\n`;
      if (part.codigo_interno) description += `Código Interno: ${part.codigo_interno}\n`;
      description += `Condição: ${part.condicao}\n`;
      if (part.observacoes) description += `\nObservações: ${part.observacoes}\n`;

      // Add compatibility info
      if (part.part_compatibilities?.length > 0) {
        description += '\n--- Compatibilidade ---\n';
        for (const compat of part.part_compatibilities) {
          description += `${compat.marca} ${compat.modelo}`;
          if (compat.ano_inicio && compat.ano_fim) {
            description += ` (${compat.ano_inicio}-${compat.ano_fim})`;
          }
          description += '\n';
        }
      }

      // Get user site_id for category
      const mlUser = await mlApiCall('/users/me', accessToken);
      const siteId = mlUser.site_id || 'MLB'; // Default to Brazil

      // Create ML listing data
      const mlListing = {
        title,
        category_id: listing_data?.category_id || 'MLB1747', // Default: Autopeças
        price: part.preco_venda || 100,
        currency_id: 'BRL',
        available_quantity: part.quantidade,
        buying_mode: 'buy_it_now',
        condition: part.condicao === 'nova' ? 'new' : 'used',
        listing_type_id: 'gold_special', // Premium listing
        description: { plain_text: description },
        pictures: part.part_images
          ?.sort((a: any, b: any) => (a.order_position || 0) - (b.order_position || 0))
          ?.slice(0, 10) // ML max 10 images
          ?.map((img: any) => ({
            source: `${SUPABASE_URL}/storage/v1/object/public/part-images/${img.file_path}`,
          })) || [],
        ...listing_data,
      };

      console.log('Creating ML listing:', JSON.stringify(mlListing, null, 2));

      // Create listing on ML
      const mlResponse = await mlApiCall('/items', accessToken, {
        method: 'POST',
        body: JSON.stringify(mlListing),
      });

      console.log('ML listing created:', mlResponse.id);

      // Save listing in database
      const { data: newListing, error: listingError } = await supabase
        .from('marketplace_listings')
        .insert({
          part_id,
          marketplace_account_id: account_id,
          external_id: mlResponse.id,
          titulo: title,
          preco: part.preco_venda || 100,
          status: 'active',
          last_sync: new Date().toISOString(),
        })
        .select()
        .single();

      if (listingError) {
        console.error('Failed to save listing:', listingError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          listing_id: newListing?.id,
          ml_id: mlResponse.id,
          permalink: mlResponse.permalink 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update listing stock/price
    if (action === 'update_listing') {
      const { listing_id, price, quantity, status } = body;

      const { data: listing, error: listingError } = await supabase
        .from('marketplace_listings')
        .select('external_id')
        .eq('id', listing_id)
        .single();

      if (listingError || !listing?.external_id) {
        return new Response(
          JSON.stringify({ error: 'Listing not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updateData: Record<string, any> = {};
      if (price !== undefined) updateData.price = price;
      if (quantity !== undefined) updateData.available_quantity = quantity;
      if (status !== undefined) {
        updateData.status = status === 'active' ? 'active' : 'paused';
      }

      console.log('Updating ML listing:', listing.external_id, updateData);

      await mlApiCall(`/items/${listing.external_id}`, accessToken, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Update local listing
      await supabase
        .from('marketplace_listings')
        .update({
          preco: price,
          status: status || 'active',
          last_sync: new Date().toISOString(),
        })
        .eq('id', listing_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sync all listings for an account (fetch from ML and import)
    if (action === 'sync_all') {
      console.log('Syncing all listings for account:', account_id);

      // Define background sync task
      async function performSync() {
        try {
          // First, get ML user ID
          const mlUser = await mlApiCall('/users/me', accessToken);
          const mlUserId = mlUser.id;
          console.log('ML User ID:', mlUserId);

          // Fetch ALL items from ML using date-based pagination to bypass the 1000 offset limit
          // Strategy: fetch items sorted by date, then use date filter to get older items
          const limit = 50;
          let allItems: any[] = [];
          const statuses = ['active', 'paused']; // Fetch active and paused listings
          
          for (const status of statuses) {
            let hasMore = true;
            let lastDateCreated: string | null = null;
            let fetchedIds = new Set<string>(); // Track fetched IDs to avoid duplicates
            
            console.log(`Starting to fetch all ${status} items...`);
            
            while (hasMore) {
              // Build endpoint with optional date filter
              let endpoint = `/users/${mlUserId}/items/search?status=${status}&limit=${limit}&sort=date_created&order=desc`;
              
              // Add date filter to get items older than the last one we fetched
              if (lastDateCreated) {
                endpoint += `&date_created_to=${encodeURIComponent(lastDateCreated)}`;
              }
              
              let searchResult;
              try {
                searchResult = await mlApiCall(endpoint, accessToken);
              } catch (error) {
                console.log(`Error fetching ${status} items:`, error);
                break;
              }
              
              const results = searchResult.results || [];
              console.log(`Fetched ${results.length} ${status} item IDs`);
              
              if (results.length === 0) {
                hasMore = false;
                break;
              }
              
              // Filter out already fetched items (can happen at boundary)
              const newItemIds = results.filter((id: string) => !fetchedIds.has(id));
              
              if (newItemIds.length === 0) {
                hasMore = false;
                break;
              }
              
              // Get full item details in batches of 20
              for (let i = 0; i < newItemIds.length; i += 20) {
                const batch = newItemIds.slice(i, i + 20);
                const itemsResponse = await mlApiCall(
                  `/items?ids=${batch.join(',')}`,
                  accessToken
                );
                
                for (const itemData of itemsResponse) {
                  if (itemData.code === 200 && itemData.body) {
                    const item = itemData.body;
                    
                    // Track this item to avoid duplicates
                    fetchedIds.add(item.id);
                    allItems.push(item);
                    
                    // Update lastDateCreated to the oldest item's date
                    if (item.date_created) {
                      if (!lastDateCreated || item.date_created < lastDateCreated) {
                        lastDateCreated = item.date_created;
                      }
                    }
                  }
                }
              }
              
              // If we got less than the limit, we've reached the end
              if (results.length < limit) {
                hasMore = false;
              }
              
              console.log(`Progress: ${fetchedIds.size} ${status} items fetched so far...`);
            }
            
            console.log(`Completed ${status}: ${fetchedIds.size} items total`);
          }

          console.log(`Total items fetched from ML: ${allItems.length}`);

          // Get existing listings in our database
          const { data: existingListings } = await supabase
            .from('marketplace_listings')
            .select('external_id')
            .eq('marketplace_account_id', account_id);

          const existingExternalIds = new Set(existingListings?.map(l => l.external_id) || []);

          let imported = 0;
          let updated = 0;
          const errors: string[] = [];

          // Separate items into new and existing
          const newItems = allItems.filter(item => !existingExternalIds.has(item.id));
          const existingItems = allItems.filter(item => existingExternalIds.has(item.id));

          console.log(`Processing: ${newItems.length} new, ${existingItems.length} existing`);

          // Batch insert new items (50 at a time for speed)
          const batchSize = 50;
          for (let i = 0; i < newItems.length; i += batchSize) {
            const batch = newItems.slice(i, i + batchSize);
            const insertData = batch.map(item => ({
              marketplace_account_id: account_id,
              external_id: item.id,
              titulo: item.title?.substring(0, 255) || 'Sem título',
              preco: item.price || 0,
              status: item.status === 'active' ? 'active' : 'paused',
              part_id: null,
              last_sync: new Date().toISOString(),
            }));

            const { error: batchError } = await supabase
              .from('marketplace_listings')
              .insert(insertData);

            if (batchError) {
              console.error(`Batch insert error (${i}-${i + batch.length}):`, batchError.message);
              errors.push(`Batch ${i}: ${batchError.message}`);
            } else {
              imported += batch.length;
              console.log(`Inserted batch ${i}-${i + batch.length}: ${batch.length} items`);
            }
          }

          // Batch update existing items (50 at a time)
          for (let i = 0; i < existingItems.length; i += batchSize) {
            const batch = existingItems.slice(i, i + batchSize);
            
            // Update each item in the batch (Supabase doesn't support bulk update with different values)
            for (const item of batch) {
              try {
                await supabase
                  .from('marketplace_listings')
                  .update({
                    titulo: item.title?.substring(0, 255) || 'Sem título',
                    preco: item.price || 0,
                    status: item.status === 'active' ? 'active' : 'paused',
                    last_sync: new Date().toISOString(),
                  })
                  .eq('external_id', item.id)
                  .eq('marketplace_account_id', account_id);
                
                updated++;
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Update ${item.id}: ${errorMessage}`);
              }
            }
            console.log(`Updated batch ${i}-${i + batch.length}`);
          }

          console.log(`Sync complete: ${imported} imported, ${updated} updated, ${errors.length} errors`);

          // Update account last sync time
          await supabase
            .from('marketplace_accounts')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', account_id);

        } catch (error) {
          console.error('Background sync error:', error);
        }
      }

      // Start background task and return immediately
      (globalThis as any).EdgeRuntime.waitUntil(performSync());

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sincronização iniciada em segundo plano. Os anúncios serão importados nos próximos minutos.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ML categories
    if (action === 'get_categories') {
      const categories = await mlApiCall('/sites/MLB/categories', accessToken);
      return new Response(
        JSON.stringify({ categories }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in ml-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
