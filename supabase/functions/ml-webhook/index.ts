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
          for (const account of accounts) {
            try {
              const questionResponse = await fetch(`${ML_API_URL}${resource}`, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              });
              
              if (!questionResponse.ok) continue;
              
              const question = await questionResponse.json();
              
              // Find listing
              const { data: listing } = await supabase
                .from('marketplace_listings')
                .select('id')
                .eq('external_id', question.item_id)
                .single();

              if (!listing) continue;

              // Check if exists
              const { data: existing } = await supabase
                .from('marketplace_questions')
                .select('id')
                .eq('external_id', question.id.toString())
                .single();

              if (!existing && question.status === 'UNANSWERED') {
                await supabase
                  .from('marketplace_questions')
                  .insert({
                    listing_id: listing.id,
                    external_id: question.id.toString(),
                    question: question.text,
                    customer_name: 'Usuário ML',
                    status: 'pending',
                    received_at: question.date_created,
                  });
                console.log('New question saved:', question.id);
              }
              break;
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
          for (const account of accounts) {
            try {
              const itemResponse = await fetch(`${ML_API_URL}${resource}`, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              });
              
              if (!itemResponse.ok) continue;
              
              const item = await itemResponse.json();
              
              // Update our listing
              await supabase
                .from('marketplace_listings')
                .update({
                  preco: item.price,
                  status: item.status === 'active' ? 'active' : 'paused',
                  last_sync: new Date().toISOString(),
                })
                .eq('external_id', item.id);

              console.log('Listing updated from webhook:', item.id);
              break;
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
    return new Response('Webhook endpoint active', { headers: corsHeaders });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
