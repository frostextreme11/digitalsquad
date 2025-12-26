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
    console.log("Midtrans Notification:", JSON.stringify(notification)) // Log incoming webhook

    const { order_id, transaction_status, fraud_status } = notification

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if transaction exists first
    const { data: existingTx, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', order_id)
      .maybeSingle()

    if (findError) {
      console.error("Error finding transaction:", findError)
      throw new Error("Database error finding transaction")
    }

    if (!existingTx) {
      console.error("Transaction not found for order_id:", order_id)
      // If not found, we can't update. 
      throw new Error("Transaction not found")
    }

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

    console.log(`Updating transaction ${order_id} to status: ${status}`)

    // Update transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .update({ status: status, midtrans_id: order_id })
      .eq('id', order_id)
      .select()
      .single()

    if (txError) {
      console.error("Transaction update failed", txError)
      throw new Error("Transaction update failed: " + txError.message)
    }

    // If success and type is registration, process registration logic
    if (status === 'success') {
      if (transaction.type === 'registration') {
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
      } else if (transaction.type === 'product_purchase') {
        // Handle Product Purchase

        // 1. Update product_purchases status
        const { data: purchase, error: purchaseError } = await supabase
          .from('product_purchases')
          .update({ status: 'success' })
          .eq('transaction_id', transaction.id)
          .select()
          .single()

        if (purchaseError) console.error("Error updating purchase status:", purchaseError)

        // 2. Process Commission if agent_code exists
        if (purchase && purchase.agent_code) {
          const { data: agent } = await supabase.from('profiles').select('id').eq('affiliate_code', purchase.agent_code).single()

          if (agent) {
            // Check existing commission
            const { data: existingComm } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).single()

            if (!existingComm) {
              // Get product commission rate
              const { data: product } = await supabase.from('products').select('commission_rate').eq('id', purchase.product_id).single()
              const rate = product?.commission_rate || 0.5
              const commissionAmount = transaction.amount * rate

              const { error: commError } = await supabase.from('commissions').insert({
                agent_id: agent.id,
                source_transaction_id: transaction.id,
                amount: commissionAmount
              })

              if (!commError) {
                await supabase.rpc('increment_balance', { user_id: agent.id, amount: commissionAmount })
              }
            }
          }
        }

        // 3. Send Email
        if (purchase) {
          const { data: product } = await supabase.from('products').select('*').eq('id', purchase.product_id).single()

          if (product) {
            // Call send-email function
            const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-email`

            // We need to fetch with SERVICE ROLE KEY to authorization
            // But usually functions allow anon if we set it, but we might want to be secure.
            // Let's rely on the internal invoke or just fetch.

            await fetch(emailFunctionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}` // Use Service Role Key to bypass potential RLS/Auth checks? Or Anon.
              },
              body: JSON.stringify({
                to: purchase.customer_email,
                subject: `Akses Produk: ${product.title}`,
                type: 'product_delivery',
                data: {
                  customerName: purchase.customer_name,
                  productTitle: product.title,
                  fileUrl: product.file_url // Ensure this is not null
                }
              })
            })
          }
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
