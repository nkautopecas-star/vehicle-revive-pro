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

      // Build family_name - generic description of the product (max 120 chars)
      // This is required by the new ML User Products model
      let familyName = part.nome;
      if (part.codigo_oem) {
        familyName = `${part.nome} ${part.codigo_oem}`;
      }
      familyName = familyName.substring(0, 120);

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
        family_name: familyName,
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
        // Add shipping info if dimensions are available
        ...(part.peso_gramas && part.comprimento_cm && part.largura_cm && part.altura_cm ? {
          shipping: {
            mode: 'me2',
            local_pick_up: false,
            free_shipping: false,
            dimensions: `${part.comprimento_cm}x${part.largura_cm}x${part.altura_cm},${part.peso_gramas}`,
          },
        } : {}),
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

      // Create a sync job to track progress
      const { data: syncJob, error: syncJobError } = await supabase
        .from('sync_jobs')
        .insert({
          marketplace_account_id: account_id,
          status: 'pending',
          total_items: 0,
          processed_items: 0,
          imported_items: 0,
          updated_items: 0,
        })
        .select()
        .single();

      if (syncJobError) {
        console.error('Failed to create sync job:', syncJobError);
        return new Response(
          JSON.stringify({ error: 'Failed to create sync job' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const jobId = syncJob.id;

      // Helper to update job progress
      async function updateJobProgress(updates: Record<string, any>) {
        await supabase
          .from('sync_jobs')
          .update(updates)
          .eq('id', jobId);
      }

      // Define background sync task
      async function performSync() {
        try {
          // Mark job as running
          await updateJobProgress({ status: 'running' });

          // First, get ML user ID
          const mlUser = await mlApiCall('/users/me', accessToken);
          const mlUserId = mlUser.id;
          console.log('ML User ID:', mlUserId);

          // Fetch ALL items from ML using scroll_id for pagination beyond 1000 offset limit
          const limit = 50;
          let allItems: any[] = [];
          const statuses = ['active', 'paused'];
          
          for (const status of statuses) {
            let offset = 0;
            let scrollId: string | null = null;
            let hasMore = true;
            
            console.log(`Starting to fetch all ${status} items...`);
            
            while (hasMore) {
              let endpoint: string;
              
              // Use scroll_id if available (for pagination beyond 1000)
              if (scrollId) {
                endpoint = `/users/${mlUserId}/items/search?status=${status}&scroll_id=${scrollId}`;
              } else {
                endpoint = `/users/${mlUserId}/items/search?status=${status}&offset=${offset}&limit=${limit}`;
              }
              
              let searchResult;
              try {
                searchResult = await mlApiCall(endpoint, accessToken);
              } catch (error) {
                console.log(`Error fetching ${status} items at offset ${offset}:`, error);
                break;
              }
              
              const results = searchResult.results || [];
              console.log(`Fetched ${results.length} ${status} item IDs (offset: ${offset})`);
              
              if (results.length === 0) {
                hasMore = false;
                break;
              }
              
              // Get scroll_id for next page if available
              if (searchResult.scroll_id) {
                scrollId = searchResult.scroll_id;
              }
              
              // Get full item details in batches of 20
              for (let i = 0; i < results.length; i += 20) {
                const batch = results.slice(i, i + 20);
                const itemsResponse = await mlApiCall(
                  `/items?ids=${batch.join(',')}`,
                  accessToken
                );
                
                for (const itemData of itemsResponse) {
                  if (itemData.code === 200 && itemData.body) {
                    allItems.push(itemData.body);
                  }
                }
              }
              
              // Update job with total items found so far
              await updateJobProgress({ total_items: allItems.length });
              
              // Check if we should continue
              if (results.length < limit) {
                hasMore = false;
              } else {
                offset += limit;
                // If we're past 1000 offset and don't have scroll_id, we've hit the limit
                if (offset >= 1000 && !scrollId) {
                  console.log(`Reached offset limit of 1000 for ${status}, stopping.`);
                  hasMore = false;
                }
              }
              
              console.log(`Progress: ${allItems.length} total items fetched so far...`);
            }
            
            console.log(`Completed ${status}: fetched items, total now: ${allItems.length}`);
          }

          console.log(`Total items fetched from ML: ${allItems.length}`);
          
          // Update total items
          await updateJobProgress({ total_items: allItems.length });

          // Get existing listings in our database
          const { data: existingListings } = await supabase
            .from('marketplace_listings')
            .select('external_id')
            .eq('marketplace_account_id', account_id);

          const existingExternalIds = new Set(existingListings?.map(l => l.external_id) || []);

          let imported = 0;
          let updated = 0;
          let processed = 0;
          const errors: string[] = [];

          const newItems = allItems.filter(item => !existingExternalIds.has(item.id));
          const existingItems = allItems.filter(item => existingExternalIds.has(item.id));

          console.log(`Processing: ${newItems.length} new, ${existingItems.length} existing`);

          // Batch insert new items
          const batchSize = 50;
          for (let i = 0; i < newItems.length; i += batchSize) {
            const batch = newItems.slice(i, i + batchSize);
            const insertData = batch.map(item => {
              // Get the first image URL from ML item pictures
              const imageUrl = item.pictures?.[0]?.url || item.pictures?.[0]?.secure_url || item.thumbnail || null;
              
              return {
                marketplace_account_id: account_id,
                external_id: item.id,
                titulo: item.title?.substring(0, 255) || 'Sem título',
                preco: item.price || 0,
                status: item.status === 'active' ? 'active' : 'paused',
                part_id: null,
                last_sync: new Date().toISOString(),
                image_url: imageUrl,
              };
            });

            const { error: batchError } = await supabase
              .from('marketplace_listings')
              .insert(insertData);

            if (batchError) {
              console.error(`Batch insert error (${i}-${i + batch.length}):`, batchError.message);
              errors.push(`Batch ${i}: ${batchError.message}`);
            } else {
              imported += batch.length;
            }
            
            processed += batch.length;
            await updateJobProgress({ 
              processed_items: processed, 
              imported_items: imported 
            });
            
            console.log(`Inserted batch ${i}-${i + batch.length}: ${batch.length} items`);
          }

          // Batch update existing items
          for (let i = 0; i < existingItems.length; i += batchSize) {
            const batch = existingItems.slice(i, i + batchSize);
            
            for (const item of batch) {
              try {
                // Get the first image URL from ML item pictures
                const imageUrl = item.pictures?.[0]?.url || item.pictures?.[0]?.secure_url || item.thumbnail || null;
                
                await supabase
                  .from('marketplace_listings')
                  .update({
                    titulo: item.title?.substring(0, 255) || 'Sem título',
                    preco: item.price || 0,
                    status: item.status === 'active' ? 'active' : 'paused',
                    last_sync: new Date().toISOString(),
                    image_url: imageUrl,
                  })
                  .eq('external_id', item.id)
                  .eq('marketplace_account_id', account_id);
                
                updated++;
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Update ${item.id}: ${errorMessage}`);
              }
            }
            
            processed += batch.length;
            await updateJobProgress({ 
              processed_items: processed, 
              updated_items: updated 
            });
            
            console.log(`Updated batch ${i}-${i + batch.length}`);
          }

          console.log(`Sync complete: ${imported} imported, ${updated} updated, ${errors.length} errors`);

          // Mark job as completed
          await updateJobProgress({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
          });

          // Update account last sync time
          await supabase
            .from('marketplace_accounts')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', account_id);

        } catch (error) {
          console.error('Background sync error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await updateJobProgress({ 
            status: 'error',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          });
        }
      }

      // Start background task and return immediately
      (globalThis as any).EdgeRuntime.waitUntil(performSync());

      return new Response(
        JSON.stringify({ 
          success: true, 
          job_id: jobId,
          message: 'Sincronização iniciada em segundo plano.'
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
