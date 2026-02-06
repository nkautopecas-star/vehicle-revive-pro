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

interface RetryContext {
  supabase: any;
  accountId: string;
  refreshToken: string;
}

interface SyncCursor {
  statuses: string[];
  statusIndex: number;
  offset: number;
  dateEnd: string | null;
  scrollId: string | null;
  mlUserId?: number;
  totalFetched: number;
  emptyPagesInARow: number;
}

async function refreshAccessToken(supabase: ReturnType<typeof createClient>, accountId: string, refreshToken: string): Promise<string | null> {
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
      await (supabase as any)
        .from('marketplace_accounts')
        .update({ status: 'error' })
        .eq('id', accountId);
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
    
    if (response.status === 401 && retryContext) {
      console.log('Got 401, attempting to refresh token...');
      const newToken = await refreshAccessToken(
        retryContext.supabase, 
        retryContext.accountId, 
        retryContext.refreshToken
      );
      
      if (newToken) {
        console.log('Retrying request with new token...');
        return mlApiCall(endpoint, newToken, options);
      } else {
        throw new Error('TOKEN_EXPIRED: Não foi possível renovar o token do Mercado Livre. Por favor, reconecte sua conta na página de Integrações.');
      }
    }
    
    let parsedError;
    try {
      parsedError = JSON.parse(error);
    } catch {
      throw new Error(`ML API error: ${response.status} - ${error}`);
    }

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
    
    const retryContext: RetryContext = {
      supabase,
      accountId: account_id,
      refreshToken: refreshToken || '',
    };

    // ===== CREATE LISTING =====
    if (action === 'create_listing') {
      console.log('Creating listing for part:', part_id);

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

      let title = part.nome;
      if (part.vehicles) {
        title = `${part.nome} ${part.vehicles.marca} ${part.vehicles.modelo} ${part.vehicles.ano}`;
      } else if (part.part_compatibilities?.length > 0) {
        const compat = part.part_compatibilities[0];
        title = `${part.nome} ${compat.marca} ${compat.modelo}`;
      }
      title = title.substring(0, 60);

      let familyName = part.nome;
      if (part.codigo_oem) {
        familyName = `${part.nome} ${part.codigo_oem}`;
      }
      familyName = familyName.substring(0, 120);

      let description = `${part.nome}\n\n`;
      if (part.codigo_oem) description += `Código OEM: ${part.codigo_oem}\n`;
      if (part.codigo_interno) description += `Código Interno: ${part.codigo_interno}\n`;
      description += `Condição: ${part.condicao}\n`;
      if (part.observacoes) description += `\nObservações: ${part.observacoes}\n`;

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

      const mlUser = await mlApiCall('/users/me', accessToken, {}, retryContext);
      const siteId = mlUser.site_id || 'MLB';

      const attributes: Array<{ id: string; value_id?: string; value_name?: string }> = [
        {
          id: 'ITEM_CONDITION',
          value_id: part.condicao === 'nova' ? '2230284' : '2230581',
        },
      ];

      let brandValue = 'Genérica';
      if (part.part_compatibilities?.length > 0) {
        const marca = part.part_compatibilities[0].marca;
        if (marca) {
          brandValue = marca;
        }
      } else if (part.vehicles?.marca) {
        brandValue = part.vehicles.marca;
      }
      attributes.push({ id: 'BRAND', value_name: brandValue });

      let partNumber = part.codigo_oem || part.codigo_interno || `INT-${part_id.substring(0, 8).toUpperCase()}`;
      attributes.push({ id: 'PART_NUMBER', value_name: partNumber });

      if (part.codigo_oem) {
        attributes.push({ id: 'ALPHANUMERIC_OEM', value_name: part.codigo_oem });
      }

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

      const hasPictures = part.part_images && part.part_images.length > 0;
      const listingTypeId = hasPictures ? 'gold_special' : 'gold_pro';

      const mlListing: Record<string, any> = {
        family_name: familyName,
        category_id: listing_data?.category_id || 'MLB439572',
        price: part.preco_venda || 100,
        currency_id: 'BRL',
        available_quantity: part.quantidade,
        buying_mode: 'buy_it_now',
        listing_type_id: listingTypeId,
        description: { plain_text: description },
        attributes,
        pictures: part.part_images
          ?.sort((a: any, b: any) => (a.order_position || 0) - (b.order_position || 0))
          ?.slice(0, 10)
          ?.map((img: any) => ({
            source: `${SUPABASE_URL}/storage/v1/object/public/part-images/${img.file_path}`,
          })) || [],
        ...(listing_data || {}),
      };

      if (!mlListing.category_id || mlListing.category_id === 'MLB1747') {
        mlListing.category_id = 'MLB439572';
      }

      if (part.peso_gramas && part.comprimento_cm && part.largura_cm && part.altura_cm) {
        mlListing.shipping = {
          mode: 'me2',
          local_pick_up: false,
          free_shipping: false,
          dimensions: `${Math.round(part.altura_cm)}x${Math.round(part.largura_cm)}x${Math.round(part.comprimento_cm)},${Math.round(part.peso_gramas)}`,
        };
      } else {
        delete mlListing.shipping;
      }

      console.log('Creating ML listing:', JSON.stringify(mlListing, null, 2));

      const mlResponse = await mlApiCall('/items', accessToken, {
        method: 'POST',
        body: JSON.stringify(mlListing),
      }, retryContext);

      console.log('ML listing created:', mlResponse.id);

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

    // ===== UPDATE LISTING =====
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

    // ===== SYNC ALL — RESUMABLE, ONE PAGE AT A TIME =====
    if (action === 'sync_all') {
      console.log('sync_all called for account:', account_id);

      // Look for existing running/pending job or create one
      let { data: syncJob } = await supabase
        .from('sync_jobs')
        .select('*')
        .eq('marketplace_account_id', account_id)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const isNew = !syncJob;

      if (!syncJob) {
        const defaultCursor: SyncCursor = {
          statuses: ['active', 'paused', 'closed'],
          statusIndex: 0,
          offset: 0,
          dateEnd: null,
          scrollId: null,
          totalFetched: 0,
          emptyPagesInARow: 0,
        };

        const { data: newJob, error: jobError } = await supabase
          .from('sync_jobs')
          .insert({
            marketplace_account_id: account_id,
            status: 'running',
            total_items: 0,
            processed_items: 0,
            imported_items: 0,
            updated_items: 0,
            cursor: defaultCursor,
            attempts: 0,
          })
          .select()
          .single();

        if (jobError || !newJob) {
          console.error('Failed to create sync job:', jobError);
          return new Response(
            JSON.stringify({ error: 'Failed to create sync job' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        syncJob = newJob;
      } else {
        // Resume existing
        await supabase
          .from('sync_jobs')
          .update({ status: 'running', attempts: (syncJob.attempts || 0) + 1 })
          .eq('id', syncJob.id);
      }

      const jobId = syncJob.id;
      let cursor: SyncCursor = syncJob.cursor || {
        statuses: ['active', 'paused', 'closed'],
        statusIndex: 0,
        offset: 0,
        dateEnd: null,
        scrollId: null,
        totalFetched: 0,
        emptyPagesInARow: 0,
      };

      // Helper to update job in DB
      async function updateJob(updates: Record<string, any>) {
        await supabase.from('sync_jobs').update(updates).eq('id', jobId);
      }

      try {
        // Get ML user ID if not stored
        if (!cursor.mlUserId) {
          const mlUser = await mlApiCall('/users/me', accessToken, {}, retryContext);
          cursor.mlUserId = mlUser.id;
        }
        const mlUserId = cursor.mlUserId;

        const LIMIT = 50;
        const MAX_EMPTY = 3;

        // --- FETCH ONE PAGE ---
        if (cursor.statusIndex >= cursor.statuses.length) {
          // Finished all statuses
          await updateJob({
            status: 'completed',
            completed_at: new Date().toISOString(),
            cursor,
          });

          await supabase
            .from('marketplace_accounts')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', account_id);

          console.log('Sync complete. Total items:', cursor.totalFetched);
          return new Response(
            JSON.stringify({ success: true, job_id: jobId, done: true, synced: cursor.totalFetched }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const currentStatus = cursor.statuses[cursor.statusIndex];

        // Build endpoint - use scroll_id if available for more reliable pagination
        let endpoint = `/users/${mlUserId}/items/search?status=${currentStatus}&limit=${LIMIT}&sort=date_created_desc`;
        
        // Add scroll_id for continuation (more reliable than offset for large datasets)
        if (cursor.scrollId) {
          endpoint += `&scroll_id=${encodeURIComponent(cursor.scrollId)}`;
        } else {
          // Only use offset on first page of a date window
          endpoint += `&offset=${cursor.offset}`;
        }
        
        if (cursor.dateEnd) {
          endpoint += `&date_created_to=${encodeURIComponent(cursor.dateEnd)}`;
        }

        console.log(`Fetching: ${currentStatus} offset=${cursor.offset} scrollId=${cursor.scrollId || 'none'} dateEnd=${cursor.dateEnd || 'none'}`);

        let searchResult;
        try {
          searchResult = await mlApiCall(endpoint, accessToken, {}, retryContext);
        } catch (error) {
          console.error('Error fetching items page:', error);
          await updateJob({ cursor, error_message: String(error) });
          return new Response(
            JSON.stringify({ error: String(error), job_id: jobId }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const ids: string[] = searchResult.results || [];
        const paging = searchResult.paging || {};
        const scrollId = searchResult.scroll_id || null;
        console.log(`Got ${ids.length} items (total in status: ${paging.total || 0}) scrollId=${scrollId ? 'present' : 'none'}`);

        // Fetch item details
        const items: any[] = [];
        let oldestDate: string | null = null;

        for (let i = 0; i < ids.length; i += 20) {
          const batch = ids.slice(i, i + 20);
          try {
            const itemsResp = await mlApiCall(
              `/items?ids=${batch.join(',')}&attributes=id,title,price,status,date_created,thumbnail,pictures,listing_type_id`,
              accessToken,
              {},
              retryContext
            );
            for (const itemData of itemsResp) {
              if (itemData.code === 200 && itemData.body) {
                items.push(itemData.body);
                if (itemData.body.date_created) {
                  if (!oldestDate || itemData.body.date_created < oldestDate) {
                    oldestDate = itemData.body.date_created;
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error fetching item details:', err);
          }
          await new Promise(r => setTimeout(r, 100)); // rate limit delay
        }

        // Upsert items into DB and auto-create parts
        if (items.length > 0) {
          // First, check which listings already exist
          const externalIds = items.map(item => item.id);
          const { data: existingListings } = await supabase
            .from('marketplace_listings')
            .select('external_id, part_id')
            .eq('marketplace_account_id', account_id)
            .in('external_id', externalIds);
          
          const existingMap = new Map<string, { part_id: string | null }>();
          for (const listing of existingListings || []) {
            existingMap.set(listing.external_id, { part_id: listing.part_id });
          }

          // Get the user_id from the marketplace account
          const { data: accountData } = await supabase
            .from('marketplace_accounts')
            .select('user_id')
            .eq('id', account_id)
            .single();
          
          const userId = accountData?.user_id;

          const upsertData: Array<{
            marketplace_account_id: string;
            external_id: string;
            titulo: string;
            preco: number;
            status: 'active' | 'paused' | 'sold';
            part_id: string | null;
            last_sync: string;
            image_url: string | null;
            listing_type: string | null;
          }> = [];

          for (const item of items) {
            const imageUrl = item.pictures?.[0]?.url || item.pictures?.[0]?.secure_url || item.thumbnail || null;
            let mappedStatus: 'active' | 'paused' | 'sold' = 'paused';
            if (item.status === 'active') mappedStatus = 'active';
            else if (item.status === 'closed') mappedStatus = 'sold';

            const existing = existingMap.get(item.id);
            let partId = existing?.part_id || null;

            // Auto-create part if listing has no part_id and user exists
            if (!partId && userId) {
              const partStatus = mappedStatus === 'sold' ? 'vendida' : 'ativa';
              
              const { data: newPart, error: partError } = await supabase
                .from('parts')
                .insert({
                  nome: (item.title || 'Sem título').substring(0, 255),
                  preco_venda: item.price || 0,
                  condicao: 'usada',
                  quantidade: 1,
                  quantidade_minima: 0,
                  status: partStatus,
                  user_id: userId,
                })
                .select('id')
                .single();

              if (!partError && newPart) {
                partId = newPart.id;
                console.log(`Auto-created part ${newPart.id} for listing ${item.id}`);
              } else {
                console.error(`Failed to auto-create part for listing ${item.id}:`, partError);
              }
            }

            upsertData.push({
              marketplace_account_id: account_id,
              external_id: item.id,
              titulo: (item.title || 'Sem título').substring(0, 255),
              preco: item.price || 0,
              status: mappedStatus,
              part_id: partId,
              last_sync: new Date().toISOString(),
              image_url: imageUrl,
              listing_type: item.listing_type_id || null,
            });
          }

          const { error: upsertError } = await supabase
            .from('marketplace_listings')
            .upsert(upsertData, { onConflict: 'marketplace_account_id,external_id', ignoreDuplicates: false });

          if (upsertError) {
            console.error('Upsert error:', upsertError.message);
          }
        }

        cursor.totalFetched += items.length;

        // Update progress
        await updateJob({
          total_items: cursor.totalFetched,
          processed_items: cursor.totalFetched,
          imported_items: cursor.totalFetched,
          cursor,
        });

        // Decide next page - prioritize scroll_id for reliable pagination
        if (ids.length === 0) {
          // No more items in this status
          cursor.statusIndex++;
          cursor.offset = 0;
          cursor.dateEnd = null;
          cursor.scrollId = null;
          cursor.emptyPagesInARow = 0;
          console.log(`No items returned, moving to next status index: ${cursor.statusIndex}`);
        } else if (scrollId && ids.length === LIMIT) {
          // Use scroll_id for next page (most reliable method)
          cursor.scrollId = scrollId;
          cursor.offset += LIMIT;
          console.log(`Using scroll_id for next page, offset: ${cursor.offset}`);
        } else if (ids.length < LIMIT) {
          // Less than limit means we're at the end of current query
          if (!oldestDate || oldestDate === cursor.dateEnd) {
            cursor.emptyPagesInARow++;
          } else {
            cursor.emptyPagesInARow = 0;
          }

          if (cursor.emptyPagesInARow >= MAX_EMPTY) {
            // Move to next status
            cursor.statusIndex++;
            cursor.offset = 0;
            cursor.dateEnd = null;
            cursor.scrollId = null;
            cursor.emptyPagesInARow = 0;
            console.log(`Max empty pages reached, moving to next status index: ${cursor.statusIndex}`);
          } else if (oldestDate && oldestDate !== cursor.dateEnd) {
            // Move date window back for more items
            cursor.dateEnd = oldestDate;
            cursor.offset = 0;
            cursor.scrollId = null;
            console.log(`Moving date window to: ${oldestDate}`);
          } else {
            // No more progress possible, move to next status
            cursor.statusIndex++;
            cursor.offset = 0;
            cursor.dateEnd = null;
            cursor.scrollId = null;
            cursor.emptyPagesInARow = 0;
            console.log(`No progress possible, moving to next status index: ${cursor.statusIndex}`);
          }
        } else {
          // Full page but no scroll_id, fallback to offset/date pagination
          cursor.offset += LIMIT;
          if (cursor.offset >= 950) {
            // Near ML offset limit (1000), shift date window
            if (oldestDate) {
              cursor.dateEnd = oldestDate;
              console.log(`Offset limit reached, shifting to date: ${oldestDate}`);
            }
            cursor.offset = 0;
            cursor.scrollId = null;
          }
        }

        // Save cursor
        await updateJob({ cursor });

        const done = cursor.statusIndex >= cursor.statuses.length;

        if (done) {
          await updateJob({
            status: 'completed',
            completed_at: new Date().toISOString(),
          });

          await supabase
            .from('marketplace_accounts')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', account_id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            job_id: jobId,
            done,
            synced: cursor.totalFetched,
            has_more: !done,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('sync_all error:', error);
        const errMsg = error instanceof Error ? error.message : String(error);
        await updateJob({ status: 'error', error_message: errMsg, completed_at: new Date().toISOString() });
        return new Response(
          JSON.stringify({ error: errMsg, job_id: jobId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ===== GET CATEGORIES =====
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
