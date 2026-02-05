import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ML_API_URL = 'https://api.mercadolibre.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Some platforms validate webhooks with HEAD requests.
  // Return 200 so the DevCenter can save the callback URL.
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Webhook notifications don't require auth - they come from ML
  if (req.method === 'POST') {
    try {
      const notification = await req.json();
      console.log('ML Webhook received:', JSON.stringify(notification, null, 2));

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { topic, resource, user_id } = notification;

      // Find account by ML user ID (stored in nome_conta for now)
      // In production, you'd store the ML user ID in a separate column
      const { data: accounts } = await supabase
        .from('marketplace_accounts')
        .select('*')
        .eq('marketplace', 'mercadolivre')
        .eq('status', 'active');

      if (!accounts || accounts.length === 0) {
        console.log('No active ML accounts found');
        return new Response('OK', { headers: corsHeaders });
      }

      // Process based on topic
      switch (topic) {
        case 'questions':
          console.log('Processing questions notification');
          // Fetch and save the new question
          let questionProcessed = false;
          for (const account of accounts) {
            if (questionProcessed) break;
            try {
              const questionResponse = await fetch(`${ML_API_URL}${resource}`, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              });
              
              if (!questionResponse.ok) continue;
              
              const question = await questionResponse.json();
              
              // Find or create listing
              let { data: listing } = await supabase
                .from('marketplace_listings')
                .select('id')
                .eq('external_id', question.item_id)
                .single();

              // If listing doesn't exist, try to fetch item and create it
              if (!listing) {
                console.log('Listing not found for question, fetching item:', question.item_id);
                const itemResponse = await fetch(`${ML_API_URL}/items/${question.item_id}`, {
                  headers: { Authorization: `Bearer ${account.access_token}` },
                });
                
                if (itemResponse.ok) {
                  const item = await itemResponse.json();
                  const imageUrl = item.pictures?.[0]?.url || item.pictures?.[0]?.secure_url || item.thumbnail || null;
                  
                  let status: 'active' | 'paused' | 'sold' = 'active';
                  if (item.status === 'paused' || item.status === 'under_review') {
                    status = 'paused';
                  } else if (item.status === 'closed') {
                    status = 'sold';
                  }

                  const { data: newListing } = await supabase
                    .from('marketplace_listings')
                    .insert({
                      external_id: question.item_id,
                      titulo: item.title || 'Produto sem título',
                      preco: item.price || 0,
                      status,
                      marketplace_account_id: account.id,
                      last_sync: new Date().toISOString(),
                      image_url: imageUrl,
                    })
                    .select('id')
                    .single();

                  listing = newListing;
                  console.log('Created listing for question:', listing?.id);
                }
              }

              if (!listing) continue;

              // Check if question exists
              const { data: existing } = await supabase
                .from('marketplace_questions')
                .select('id')
                .eq('external_id', question.id.toString())
                .single();

              if (!existing && question.status === 'UNANSWERED') {
                // Try to get customer name
                let customerName = 'Usuário ML';
                if (question.from?.id) {
                  try {
                    const buyerResponse = await fetch(`${ML_API_URL}/users/${question.from.id}`, {
                      headers: { Authorization: `Bearer ${account.access_token}` },
                    });
                    if (buyerResponse.ok) {
                      const buyer = await buyerResponse.json();
                      customerName = buyer.nickname || 'Usuário ML';
                    }
                  } catch (e) {
                    console.log('Could not fetch buyer info');
                  }
                }

                await supabase
                  .from('marketplace_questions')
                  .insert({
                    listing_id: listing.id,
                    external_id: question.id.toString(),
                    question: question.text,
                    customer_name: customerName,
                    status: 'pending',
                    received_at: question.date_created,
                  });
                console.log('New question saved:', question.id);
              }
              questionProcessed = true;
            } catch (e) {
              console.error('Error processing question:', e);
            }
          }
          break;

        case 'orders_v2':
          console.log('Processing order notification');
          for (const account of accounts) {
            try {
              const orderResponse = await fetch(`${ML_API_URL}${resource}`, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              });
              
              if (!orderResponse.ok) continue;
              
              const order = await orderResponse.json();
              
              if (order.status === 'paid') {
                for (const item of order.order_items || []) {
                  // Find listing and part
                  const { data: listing } = await supabase
                    .from('marketplace_listings')
                    .select('id, part_id')
                    .eq('external_id', item.item.id)
                    .single();

                  if (!listing) continue;

                  // Check if sale already exists
                  const { data: existingSale } = await supabase
                    .from('sales')
                    .select('id')
                    .eq('order_external_id', order.id.toString())
                    .eq('part_id', listing.part_id)
                    .single();

                  if (!existingSale) {
                    // Create sale
                    await supabase
                      .from('sales')
                      .insert({
                        part_id: listing.part_id,
                        marketplace_account_id: account.id,
                        order_external_id: order.id.toString(),
                        customer_name: order.buyer?.nickname || 'Comprador ML',
                        quantidade: item.quantity,
                        preco_venda: item.unit_price,
                        status: 'completed',
                        sold_at: order.date_created,
                      });

                    // Update part stock
                    const { data: part } = await supabase
                      .from('parts')
                      .select('quantidade')
                      .eq('id', listing.part_id)
                      .single();

                    if (part) {
                      const newQuantity = Math.max(0, part.quantidade - item.quantity);
                      await supabase
                        .from('parts')
                        .update({ quantidade: newQuantity })
                        .eq('id', listing.part_id);

                      // If quantity is 0, pause the listing
                      if (newQuantity === 0) {
                        await supabase
                          .from('marketplace_listings')
                          .update({ status: 'sold' })
                          .eq('id', listing.id);
                      }
                    }

                    console.log('Sale recorded for order:', order.id);
                  }
                }
              }
              break;
            } catch (e) {
              console.error('Error processing order:', e);
            }
          }
          break;

        case 'items':
          console.log('Processing item update notification');
          // Item was updated on ML side - sync status
          let itemProcessed = false;
          for (const account of accounts) {
            if (itemProcessed) break;
            try {
              const itemResponse = await fetch(`${ML_API_URL}${resource}`, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              });
              
              if (!itemResponse.ok) continue;
              
              const item = await itemResponse.json();
              
              // Map ML status to our status
              let mappedStatus: 'active' | 'paused' | 'sold' = 'paused';
              if (item.status === 'active') {
                mappedStatus = 'active';
              } else if (item.status === 'closed') {
                mappedStatus = 'sold';
              }

              // Get image URL
              const imageUrl = item.pictures?.[0]?.url || item.pictures?.[0]?.secure_url || item.thumbnail || null;
              
              // Update our listing
              const { data: updatedListing } = await supabase
                .from('marketplace_listings')
                .update({
                  titulo: item.title,
                  preco: item.price,
                  status: mappedStatus,
                  image_url: imageUrl,
                  last_sync: new Date().toISOString(),
                })
                .eq('external_id', item.id)
                .select('id')
                .single();

              if (updatedListing) {
                console.log('Listing updated from webhook:', item.id);
                itemProcessed = true;
              }
            } catch (e) {
              console.error('Error processing item update:', e);
            }
          }
          break;

        default:
          console.log('Unhandled topic:', topic);
      }

      return new Response('OK', { headers: corsHeaders });
    } catch (error) {
      console.error('Webhook error:', error);
      return new Response('OK', { headers: corsHeaders }); // Always return OK to ML
    }
  }

  // GET request - for webhook verification
  if (req.method === 'GET') {
    return new Response('OK', { headers: corsHeaders });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
