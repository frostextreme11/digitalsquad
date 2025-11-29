import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, orderId, customerDetails, userId, leadId, type } = await req.json()
    
    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    let finalOrderId = orderId

    // If no orderId provided, create a new transaction
    if (!finalOrderId) {
        console.log("Creating new transaction for user:", userId)
        
        // Ensure profile exists (Edge Function has Admin rights, so we can double check)
        const { data: profile, error: profileCheckError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single()
        
        if (!profile) {
             // If profile missing, creating it now to satisfy FK
             console.log("Profile missing in DB, creating now...")
             // Need email/name from args if possible, or just insert minimal
             // But we should rely on auth trigger. 
             // If auth trigger failed, we might be in trouble.
             // Let's assume the client sent details.
             await supabaseAdmin.from('profiles').insert({
                 id: userId,
                 email: customerDetails.email,
                 full_name: customerDetails.first_name,
                 phone: customerDetails.phone,
                 role: 'agent'
             })
        }

        const { data: txn, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: userId,
                lead_id: leadId,
                amount: amount,
                type: type || 'registration',
                status: 'pending'
            })
            .select()
            .single()
        
        if (txError) {
            console.error("Transaction creation failed:", txError)
            throw new Error(`Failed to create transaction: ${txError.message}`)
        }
        finalOrderId = txn.id
    }

    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) throw new Error('Server Key not found')

    const auth = btoa(serverKey + ':')

    // Use sandbox by default, change to production URL for live
    const url = 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: finalOrderId,
          gross_amount: amount,
        },
        credit_card: {
          secure: true,
        },
        customer_details: customerDetails,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error_messages?.[0] || 'Midtrans Error')
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
