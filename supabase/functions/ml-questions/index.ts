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
    const { action, account_id } = body;

    // Get account
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

    // Fetch unanswered questions from ML
    if (action === 'fetch_questions') {
      console.log('Fetching questions for account:', account_id);

      // Get ML user ID
      const userResponse = await fetch(`${ML_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const mlUser = await userResponse.json();

      // Fetch unanswered questions
      const questionsResponse = await fetch(
        `${ML_API_URL}/questions/search?seller_id=${mlUser.id}&status=UNANSWERED&sort_fields=date_created&sort_types=DESC`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const questionsData = await questionsResponse.json();

      if (!questionsData.questions) {
        return new Response(
          JSON.stringify({ questions: [], total: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${questionsData.questions.length} unanswered questions`);

      // Process and save questions
      for (const q of questionsData.questions) {
        // Get item details to find our listing
        const itemResponse = await fetch(`${ML_API_URL}/items/${q.item_id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const item = await itemResponse.json();

        // Find our listing
        const { data: listing } = await supabase
          .from('marketplace_listings')
          .select('id')
          .eq('external_id', q.item_id)
          .single();

        if (!listing) {
          console.log('Listing not found for item:', q.item_id);
          continue;
        }

        // Check if question already exists
        const { data: existingQuestion } = await supabase
          .from('marketplace_questions')
          .select('id')
          .eq('external_id', q.id.toString())
          .single();

        if (!existingQuestion) {
          // Get customer name if available
          let customerName = 'Usuário ML';
          if (q.from?.id) {
            try {
              const buyerResponse = await fetch(`${ML_API_URL}/users/${q.from.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const buyer = await buyerResponse.json();
              customerName = buyer.nickname || 'Usuário ML';
            } catch (e) {
              console.log('Could not fetch buyer info');
            }
          }

          // Insert question
          await supabase
            .from('marketplace_questions')
            .insert({
              listing_id: listing.id,
              external_id: q.id.toString(),
              question: q.text,
              customer_name: customerName,
              status: 'pending',
              received_at: q.date_created,
            });

          console.log('Saved new question:', q.id);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          fetched: questionsData.questions.length,
          total: questionsData.total 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Answer a question
    if (action === 'answer_question') {
      const { question_id, answer } = body;

      if (!question_id || !answer) {
        return new Response(
          JSON.stringify({ error: 'question_id and answer are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get question
      const { data: question, error: questionError } = await supabase
        .from('marketplace_questions')
        .select('external_id')
        .eq('id', question_id)
        .single();

      if (questionError || !question?.external_id) {
        return new Response(
          JSON.stringify({ error: 'Question not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Answering question:', question.external_id);

      // Send answer to ML
      const answerResponse = await fetch(`${ML_API_URL}/answers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: parseInt(question.external_id),
          text: answer,
        }),
      });

      if (!answerResponse.ok) {
        const errorText = await answerResponse.text();
        console.error('Failed to answer question:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to send answer to ML', details: errorText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update question in database
      await supabase
        .from('marketplace_questions')
        .update({
          answer,
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', question_id);

      console.log('Question answered successfully');

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
    console.error('Error in ml-questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
