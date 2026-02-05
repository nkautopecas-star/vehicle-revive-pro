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

// Type for retry context
interface RetryContext {
  supabase: any;
  accountId: string;
  refreshToken: string;
}

// Helper to refresh access token
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
      await supabase
        .from('marketplace_accounts')
        .update({ status: 'error' })
        .eq('id', accountId);
      return null;
    }

    const tokenData = await tokenResponse.json();
    
    await supabase
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

// Helper to make authenticated ML API calls with auto-refresh
async function mlApiCall(
  endpoint: string, 
  accessToken: string, 
  options: RequestInit = {},
  retryContext?: RetryContext
): Promise<any> {
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
    
    // Check for 401 unauthorized - try to refresh token
    if (response.status === 401 && retryContext) {
      console.log('Got 401, attempting to refresh token...');
      const newToken = await refreshAccessToken(
        retryContext.supabase, 
        retryContext.accountId, 
        retryContext.refreshToken
      );
      
      if (newToken) {
        console.log('Retrying request with new token...');
        return mlApiCall(endpoint, newToken, options); // No retry context to prevent infinite loop
      } else {
        throw new Error('TOKEN_EXPIRED: Não foi possível renovar o token do Mercado Livre. Por favor, reconecte sua conta na página de Integrações.');
      }
    }
    
    // Parse error to provide better messages
    let parsedError;
    try {
      parsedError = JSON.parse(error);
    } catch {
      throw new Error(`ML API error: ${response.status} - ${error}`);
    }

    // Check for specific error codes and provide user-friendly messages
    const causes = parsedError.cause || [];
    const errorMessages: string[] = [];
    let requiresPictures = false;

    for (const cause of causes) {
      if (cause.code === 'item.listing_type_id.requiresPictures') {
        requiresPictures = true;
        errorMessages.push('O Mercado Livre exige pelo menos uma foto para anunciar nesta categoria. Adicione fotos à peça antes de publicar.');
      } else if (cause.code === 'item.attributes.missing_required') {
        errorMessages.push(`Atributos obrigatórios faltando: ${cause.message}`);
      } else if (cause.type === 'error') {
        errorMessages.push(cause.message || cause.code);
      }
    }

    if (requiresPictures) {
      throw new Error(`PICTURES_REQUIRED: ${errorMessages.join(' | ')}`);
    }

    if (errorMessages.length > 0) {
      throw new Error(`ML_VALIDATION: ${errorMessages.join(' | ')}`);
    }

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
    const refreshToken = account.refresh_token;
    
    // Create retry context for auto-refresh
    const retryContext: RetryContext = {
      supabase,
      accountId: account_id,
      refreshToken: refreshToken || '',
    };

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
      const mlUser = await mlApiCall('/users/me', accessToken, {}, retryContext);
      const siteId = mlUser.site_id || 'MLB'; // Default to Brazil

      // Build attributes - required by ML API
      // ITEM_CONDITION is always required
      const attributes: Array<{ id: string; value_id?: string; value_name?: string }> = [
        {
          id: 'ITEM_CONDITION',
          value_id: part.condicao === 'nova' ? '2230284' : '2230581', // 2230284 = New, 2230581 = Used
        },
      ];

      // Add BRAND - REQUIRED for category MLB439572
      let brandValue = 'Genérica'; // Default value
      if (part.part_compatibilities?.length > 0) {
        const marca = part.part_compatibilities[0].marca;
        if (marca) {
          brandValue = marca;
        }
      } else if (part.vehicles?.marca) {
        brandValue = part.vehicles.marca;
      }
      attributes.push({
        id: 'BRAND',
        value_name: brandValue,
      });

      // Add PART_NUMBER - REQUIRED for category MLB439572
      // Use codigo_oem if available, otherwise use codigo_interno or generate one
      let partNumber = part.codigo_oem || part.codigo_interno || `INT-${part_id.substring(0, 8).toUpperCase()}`;
      attributes.push({
        id: 'PART_NUMBER',
        value_name: partNumber,
      });

      // Add ALPHANUMERIC_OEM if codigo_oem is available
      if (part.codigo_oem) {
        attributes.push({
          id: 'ALPHANUMERIC_OEM',
          value_name: part.codigo_oem,
        });
      }

      // Add package dimensions as attributes (required by ML)
      if (part.peso_gramas) {
        attributes.push({ id: 'SELLER_PACKAGE_WEIGHT', value_name: `${part.peso_gramas} g` });
      }
      if (part.altura_cm) {
        attributes.push({ id: 'SELLER_PACKAGE_HEIGHT', value_name: `${part.altura_cm} cm` });
      }
      if (part.largura_cm) {
        attributes.push({ id: 'SELLER_PACKAGE_WIDTH', value_name: `${part.largura_cm} cm` });
      }
      if (part.comprimento_cm) {
        attributes.push({ id: 'SELLER_PACKAGE_LENGTH', value_name: `${part.comprimento_cm} cm` });
      }

      // Create ML listing data
      // Determine listing type: gold_special requires pictures, gold_pro does not
      const hasPictures = part.part_images && part.part_images.length > 0;
      const listingTypeId = hasPictures ? 'gold_special' : 'gold_pro';

      const mlListing = {
        family_name: familyName,
        category_id: listing_data?.category_id || 'MLB439572', // Default: Bombas de Combustível
        price: part.preco_venda || 100,
        currency_id: 'BRL',
        available_quantity: part.quantidade,
        buying_mode: 'buy_it_now',
        listing_type_id: listingTypeId, // gold_pro if no pictures, gold_special if has pictures
        description: { plain_text: description },
        attributes,
        pictures: part.part_images
          ?.sort((a: any, b: any) => (a.order_position || 0) - (b.order_position || 0))
          ?.slice(0, 10) // ML max 10 images
          ?.map((img: any) => ({
            source: `${SUPABASE_URL}/storage/v1/object/public/part-images/${img.file_path}`,
          })) || [],
        // Spread listing_data first, then override with our computed values
        ...(listing_data || {}),
      };

      // Override category_id if not a valid leaf category (MLB1747 is parent category)
      if (!mlListing.category_id || mlListing.category_id === 'MLB1747') {
        mlListing.category_id = 'MLB439572'; // Bombas de Combustível - leaf category
      }

      // Override shipping with correct string format
      if (part.peso_gramas && part.comprimento_cm && part.largura_cm && part.altura_cm) {
        mlListing.shipping = {
          mode: 'me2',
          local_pick_up: false,
          free_shipping: false,
          dimensions: `${Math.round(part.altura_cm)}x${Math.round(part.largura_cm)}x${Math.round(part.comprimento_cm)},${Math.round(part.peso_gramas)}`,
        };
      } else {
        // Remove invalid shipping if present
        delete mlListing.shipping;
      }

      console.log('Creating ML listing:', JSON.stringify(mlListing, null, 2));

      // Create listing on ML
      const mlResponse = await mlApiCall('/items', accessToken, {
        method: 'POST',
        body: JSON.stringify(mlListing),
      }, retryContext);

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
      }, retryContext);

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
          const mlUser = await mlApiCall('/users/me', accessToken, {}, retryContext);
          const mlUserId = mlUser.id;
          console.log('ML User ID:', mlUserId);

          // Fetch ALL items from ML using date-based pagination
          // ML limits offset to 1000. To get ALL items, we paginate by date_created.
          const limit = 50;
          let allItems: any[] = [];
          // Include 'closed' status to get sold items
          const statuses = ['active', 'paused', 'closed'];
          // Track all processed IDs globally to avoid duplicates across statuses
          const globalProcessedIds = new Set<string>();
          
          for (const status of statuses) {
            let hasMore = true;
            let statusTotal = 0;
            let dateEnd: string | null = null; // Will hold the oldest date found
            let emptyPagesInARow = 0;
            const MAX_EMPTY_PAGES = 3;
            
            console.log(`Starting to fetch all ${status} items...`);
            
            while (hasMore) {
              let offset = 0;
              let pageHasMore = true;
              let oldestDateInPage: string | null = null;
              
              // Fetch up to 1000 items per date range (20 pages of 50)
              while (pageHasMore && offset < 1000) {
                let endpoint = `/users/${mlUserId}/items/search?status=${status}&offset=${offset}&limit=${limit}&sort=date_created_desc`;
                
                // Add date filter if we're past the first batch
                if (dateEnd) {
                  endpoint += `&date_created_to=${encodeURIComponent(dateEnd)}`;
                }
                
                let searchResult;
                try {
                  searchResult = await mlApiCall(endpoint, accessToken, {}, retryContext);
                } catch (error) {
                  console.log(`Error fetching ${status} items at offset ${offset}:`, error);
                  pageHasMore = false;
                  break;
                }
                
                const results = searchResult.results || [];
                statusTotal = searchResult.paging?.total || 0;
                
                // Filter out already processed IDs
                const newIds = results.filter((id: string) => !globalProcessedIds.has(id));
                newIds.forEach((id: string) => globalProcessedIds.add(id));
                
                console.log(`Fetched ${results.length} ${status} items (${newIds.length} new, offset: ${offset}, total: ${statusTotal})`);
                
                // Get item details and track oldest date
                for (let i = 0; i < newIds.length; i += 20) {
                  const batch = newIds.slice(i, i + 20);
                  try {
                    const itemsResponse = await mlApiCall(
                      `/items?ids=${batch.join(',')}&attributes=id,title,price,status,date_created,thumbnail,pictures`,
                      accessToken,
                      {},
                      retryContext
                    );
                    
                    for (const itemData of itemsResponse) {
                      if (itemData.code === 200 && itemData.body) {
                        allItems.push(itemData.body);
                        // Track oldest date for next iteration
                        if (itemData.body.date_created) {
                          if (!oldestDateInPage || itemData.body.date_created < oldestDateInPage) {
                            oldestDateInPage = itemData.body.date_created;
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error(`Error fetching item details batch:`, error);
                  }
                  
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                // Update progress
                await updateJobProgress({ total_items: allItems.length });
                
                // Check if we should continue this page
                if (results.length < limit) {
                  pageHasMore = false;
                } else {
                  offset += limit;
                }
              }
              
              // Check if we got any new items in this date range
              if (!oldestDateInPage || oldestDateInPage === dateEnd) {
                emptyPagesInARow++;
                if (emptyPagesInARow >= MAX_EMPTY_PAGES) {
                  console.log(`No new items for ${status} after ${MAX_EMPTY_PAGES} attempts, moving on`);
                  hasMore = false;
                }
              } else {
                emptyPagesInARow = 0;
                dateEnd = oldestDateInPage; // Move date window back
              }
              
              // If we fetched less than 1000 in this date range, we're done
              if (offset < 1000) {
                hasMore = false;
              }
              
              console.log(`Progress: ${allItems.length} total fetched for ${status}, oldest: ${dateEnd || 'n/a'}`);
            }
            
            console.log(`Completed ${status}: ${allItems.length} total fetched`);
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
              
              // Map ML status to our status: active, paused, closed->sold
              let mappedStatus: 'active' | 'paused' | 'sold' = 'paused';
              if (item.status === 'active') {
                mappedStatus = 'active';
              } else if (item.status === 'closed') {
                mappedStatus = 'sold';
              }
              
              return {
                marketplace_account_id: account_id,
                external_id: item.id,
                titulo: item.title?.substring(0, 255) || 'Sem título',
                preco: item.price || 0,
                status: mappedStatus,
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
                
                // Map ML status to our status: active, paused, closed->sold
                let mappedStatus: 'active' | 'paused' | 'sold' = 'paused';
                if (item.status === 'active') {
                  mappedStatus = 'active';
                } else if (item.status === 'closed') {
                  mappedStatus = 'sold';
                }
                
                await supabase
                  .from('marketplace_listings')
                  .update({
                    titulo: item.title?.substring(0, 255) || 'Sem título',
                    preco: item.price || 0,
                    status: mappedStatus,
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
