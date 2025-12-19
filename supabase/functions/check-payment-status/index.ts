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
    // This function allows manual trigger to force check Midtrans status 
    // OR manual override if we trust the user context (secure this!)
    // For now, let's just use it to "re-sync" status by order_id
    
    const { order_id } = await req.json()
    
    if (!order_id) throw new Error("Missing order_id")

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check Midtrans API directly to see true status
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) throw new Error('Server Key not found')
    const auth = btoa(serverKey + ':')

    // Use sandbox/production URL based on env
    // Default to sandbox for now as per previous context
    const midtransUrl = `https://api.sandbox.midtrans.com/v2/${order_id}/status`
    
    const mtResponse = await fetch(midtransUrl, {
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
        }
    })
    
    const mtData = await mtResponse.json()
    console.log("Midtrans Status Data:", mtData)
    
    if (mtData.status_code === '404') {
        return new Response(JSON.stringify({ error: "Order not found in Midtrans" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    let status = 'pending'
    const transaction_status = mtData.transaction_status
    const fraud_status = mtData.fraud_status

    if (transaction_status == 'capture') {
      if (fraud_status == 'challenge') {
        status = 'pending'
      } else if (fraud_status == 'accept') {
        status = 'success'
      }
    } else if (transaction_status == 'settlement') {
      status = 'success'
    } else if (transaction_status == 'cancel' || transaction_status == 'deny' || transaction_status == 'expire') {
      status = 'failed'
    } else if (transaction_status == 'pending') {
      status = 'pending'
    }

    // Force update DB
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .update({ status: status, midtrans_id: order_id })
      .eq('id', order_id)
      .select()
      .single()

    if (txError) throw new Error(txError.message)

    // Run same commission logic if success
     if (status === 'success' && transaction.type === 'registration') {
        // ... (Copy logic from webhook or extract to shared function)
        // For simplicity, let's just duplicate minimal logic or assume webhook might eventually hit.
        // But to fix "stuck", we must apply effects.
        
        let referrerId = null
        if (transaction.user_id) {
             const { data: profile } = await supabase.from('profiles').select('referred_by').eq('id', transaction.user_id).single()
             if (profile?.referred_by) referrerId = profile.referred_by
        }
        
        if (!referrerId && transaction.lead_id) {
            const { data: lead } = await supabase.from('leads').select('referred_by_code').eq('id', transaction.lead_id).single()
            if (lead?.referred_by_code) {
                 const { data: referrer } = await supabase.from('profiles').select('id').eq('affiliate_code', lead.referred_by_code).single()
                 if (referrer) referrerId = referrer.id
            }
        }

        if (referrerId) {
            const { data: existing } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).single()
            if (!existing) {
                const commissionAmount = transaction.amount * 0.5 
                const { error: commError } = await supabase.from('commissions').insert({
                    agent_id: referrerId,
                    source_transaction_id: transaction.id,
                    amount: commissionAmount
                })
                if (!commError) {
                    await supabase.rpc('increment_balance', { user_id: referrerId, amount: commissionAmount })
                }
            }
        }
        
        // Generate affiliate code
         if (transaction.user_id) {
            const { data: profile } = await supabase.from('profiles').select('email, affiliate_code').eq('id', transaction.user_id).single()
            if (profile && !profile.affiliate_code) {
                 let code = profile.email.split('@')[0].toUpperCase()
                 const { data: existing } = await supabase.from('profiles').select('id').eq('affiliate_code', code).single()
                 if (existing) {
                     code = code + Math.floor(Math.random() * 1000)
                 }
                 await supabase.from('profiles').update({ affiliate_code: code }).eq('id', transaction.user_id)
            }
        }
    }

    return new Response(
      JSON.stringify({ status: 'ok', new_status: status, midtrans_data: mtData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
