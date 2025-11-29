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
    const notification = await req.json()
    const { order_id, transaction_status, fraud_status } = notification

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    let status = 'pending'
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

    // Update transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .update({ status: status, midtrans_id: order_id })
      .eq('id', order_id)
      .select()
      .single()

    if (txError || !transaction) {
        console.error("Transaction update failed", txError)
        // Try to update by midtrans_id if exists? No, order_id is the key.
        // If we can't find it, maybe it's not created yet? (Race condition?)
        // But usually payment creation happens before webhook.
        throw new Error("Transaction not found or update failed")
    }

    // If success and type is registration, process registration logic
    if (status === 'success' && transaction.type === 'registration') {
        // 1. Find referrer
        let referrerId = null
        
        // Check if user has referred_by in profile
        if (transaction.user_id) {
             const { data: profile } = await supabase.from('profiles').select('referred_by').eq('id', transaction.user_id).single()
             if (profile?.referred_by) referrerId = profile.referred_by
        }
        
        // If not found in profile, maybe in lead?
        if (!referrerId && transaction.lead_id) {
            const { data: lead } = await supabase.from('leads').select('referred_by_code').eq('id', transaction.lead_id).single()
            if (lead?.referred_by_code) {
                 const { data: referrer } = await supabase.from('profiles').select('id').eq('affiliate_code', lead.referred_by_code).single()
                 if (referrer) referrerId = referrer.id
            }
        }

        if (referrerId) {
            // Check if commission already exists for this transaction
            const { data: existing } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).single()
            
            if (!existing) {
                // Create commission
                const commissionAmount = transaction.amount * 0.5 // 50% commission
                
                const { error: commError } = await supabase.from('commissions').insert({
                    agent_id: referrerId,
                    source_transaction_id: transaction.id,
                    amount: commissionAmount
                })
                
                if (!commError) {
                    // Update balance using RPC
                    await supabase.rpc('increment_balance', { user_id: referrerId, amount: commissionAmount })
                }
            }
        }
        
        // Generate affiliate code if not exists
        if (transaction.user_id) {
            const { data: profile } = await supabase.from('profiles').select('email, affiliate_code').eq('id', transaction.user_id).single()
            if (profile && !profile.affiliate_code) {
                 // Generate code from email username
                 let code = profile.email.split('@')[0].toUpperCase()
                 
                 // Check for duplicates
                 const { data: existing } = await supabase.from('profiles').select('id').eq('affiliate_code', code).single()
                 if (existing) {
                     // If duplicate, append random number
                     code = code + Math.floor(Math.random() * 1000)
                 }

                 await supabase.from('profiles').update({ affiliate_code: code }).eq('id', transaction.user_id)
            }
        }
    }

    return new Response(
      JSON.stringify({ status: 'ok' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
