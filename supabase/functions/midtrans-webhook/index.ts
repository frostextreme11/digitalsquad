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
    console.log("----------------------------------------")
    console.log("Midtrans Notification Received:", JSON.stringify(notification))
    console.log("----------------------------------------")

    const { order_id, transaction_status, fraud_status } = notification

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if transaction exists
    const { data: existingTx, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', order_id)
      .maybeSingle()

    if (findError) {
      console.error("CRITICAL: Error finding transaction:", findError)
      throw new Error("Database error finding transaction")
    }

    if (!existingTx) {
      console.error("CRITICAL: Transaction NOT FOUND for order_id:", order_id)
      return new Response("Transaction not found", { status: 404, headers: corsHeaders })
    }

    console.log(`Transaction Found: ${existingTx.id} | Type: ${existingTx.type} | Current Status: ${existingTx.status}`)

    console.log(`Processing Order ID: ${order_id} | Status: ${transaction_status} | Fraud: ${fraud_status}`)

    // Determine New Status
    let status = 'pending'
    if (transaction_status == 'capture') {
      if (fraud_status == 'challenge') {
        status = 'pending'
      } else if (fraud_status == 'accept') {
        status = 'success'
      }
    } else if (transaction_status == 'settlement') {
      status = 'success'
    } else if (transaction_status == 'success') {
      // While not standard Midtrans, some gateways might send this
      status = 'success'
    } else if (transaction_status == 'cancel' || transaction_status == 'deny' || transaction_status == 'expire' || transaction_status == 'failure') {
      status = 'failed'
    } else if (transaction_status == 'pending') {
      status = 'pending'
    }

    console.log(`Mapped Status: ${transaction_status} (+ ${fraud_status}) -> ${status}`)

    // Force success if settlement (redundant safety check)
    if (transaction_status === 'settlement') status = 'success'

    console.log(`Mapped Status: ${transaction_status} (+ ${fraud_status}) -> ${status}`)

    // Only update if status changed? Or always update to be safe?
    // Always update to capture latest Midtrans status
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .update({ status: status, midtrans_id: order_id })
      .eq('id', order_id)
      .select()
      .single()

    if (txError) {
      console.error("CRITICAL: Transaction update failed", txError)
      throw new Error("Transaction update failed")
    }

    console.log(`Transaction Updated to: ${status}`)

    // LOGIC ROUTING BASED ON TYPE
    if (status === 'success') {
      if (transaction.type === 'registration') {
        console.log("Processing REGISTRATION success logic...")
        await handleRegistrationSuccess(supabase, transaction)
      } else if (transaction.type === 'product_purchase') {
        console.log("Processing PRODUCT PURCHASE success logic...")
        await handleProductPurchaseSuccess(supabase, transaction, supabaseUrl, supabaseKey)
      }
    } else {
      console.log(`Status is ${status}, skipping success logic.`)
    }

    return new Response(
      JSON.stringify({ status: 'ok' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("WEBHOOK ERROR:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

async function handleRegistrationSuccess(supabase: any, transaction: any) {
  // 1. Find referrer
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
    // Check duplication
    const { data: existing } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).single()

    if (!existing) {
      // Get referrer's tier for commission rate
      let commissionRate = 0.30 // Default basic tier rate
      let overrideRate = null
      let uplineId = null

      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('tier_id, referred_by')
        .eq('id', referrerId)
        .single()

      if (referrerProfile?.tier_id) {
        const { data: tier } = await supabase
          .from('tiers')
          .select('commission_rate, override_commission_rate')
          .eq('id', referrerProfile.tier_id)
          .single()

        if (tier) {
          commissionRate = tier.commission_rate
          overrideRate = tier.override_commission_rate
        }
      }

      // Get upline for VIP override commission (1 level only)
      if (referrerProfile?.referred_by) {
        uplineId = referrerProfile.referred_by
      }

      const commissionAmount = transaction.amount * commissionRate
      console.log(`Creating commission: ${transaction.amount} * ${commissionRate} = ${commissionAmount}`)

      const { error: commError } = await supabase.from('commissions').insert({
        agent_id: referrerId,
        source_transaction_id: transaction.id,
        amount: commissionAmount
      })

      if (!commError) {
        console.log(`Commission created for agent ${referrerId}. Updating balance...`)
        await supabase.rpc('increment_balance', { user_id: referrerId, amount: commissionAmount })

        // Increment sales count for referrer
        await supabase.rpc('increment_sales', { user_id: referrerId })

        // Check for auto-upgrade
        await supabase.rpc('check_auto_upgrade', { check_user_id: referrerId })
      } else {
        console.error("Error creating commission:", commError)
      }

      // VIP Override Commission: Give 5% to upline if upline is VIP
      if (uplineId) {
        const { data: uplineProfile } = await supabase
          .from('profiles')
          .select('tier_id')
          .eq('id', uplineId)
          .single()

        if (uplineProfile?.tier_id) {
          const { data: uplineTier } = await supabase
            .from('tiers')
            .select('override_commission_rate, tier_key')
            .eq('id', uplineProfile.tier_id)
            .single()

          if (uplineTier?.override_commission_rate && uplineTier.tier_key === 'vip') {
            const overrideAmount = transaction.amount * uplineTier.override_commission_rate
            console.log(`VIP Override: Giving ${overrideAmount} to upline ${uplineId}`)

            await supabase.from('commissions').insert({
              agent_id: uplineId,
              source_transaction_id: transaction.id,
              amount: overrideAmount
            })

            await supabase.rpc('increment_balance', { user_id: uplineId, amount: overrideAmount })
          }
        }
      }
    }
  }

  // Assign default tier to new user if not set
  if (transaction.user_id) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('tier_id')
      .eq('id', transaction.user_id)
      .single()

    if (!userProfile?.tier_id) {
      const { data: basicTier } = await supabase
        .from('tiers')
        .select('id')
        .eq('tier_key', 'basic')
        .single()

      if (basicTier) {
        await supabase.from('profiles').update({ tier_id: basicTier.id }).eq('id', transaction.user_id)
        console.log(`Assigned basic tier to user ${transaction.user_id}`)
      }
    }
  }

  // Generate affiliate code
  if (transaction.user_id) {
    const { data: profile } = await supabase.from('profiles').select('email, affiliate_code').eq('id', transaction.user_id).single()
    if (profile && !profile.affiliate_code) {
      let code = profile.email.split('@')[0].toUpperCase()
      const { data: existing } = await supabase.from('profiles').select('id').eq('affiliate_code', code).single()
      if (existing) code = code + Math.floor(Math.random() * 1000)
      await supabase.from('profiles').update({ affiliate_code: code }).eq('id', transaction.user_id)
      console.log(`Generated affiliate code for user ${transaction.user_id}: ${code}`)
    }
  }
}

async function handleProductPurchaseSuccess(supabase: any, transaction: any, supabaseUrl: string, supabaseKey: string) {
  // 1. Update status in product_purchases
  const { data: purchase, error: purchaseError } = await supabase
    .from('product_purchases')
    .update({ status: 'success' })
    .eq('transaction_id', transaction.id)
    .select()
    .single()

  if (purchaseError) {
    console.error("CRITICAL: Error updating product_purchases status:", purchaseError)
    return // Can't proceed without purchase record
  }

  if (!purchase) {
    console.error("CRITICAL: product_purchases record not found for transaction:", transaction.id)
    return
  }

  console.log("Product Purchase Updated to SUCCESS")

  // 2. Commission Logic
  if (purchase.agent_code) {
    const { data: agent } = await supabase.from('profiles').select('id, email, tier_id, referred_by').eq('affiliate_code', purchase.agent_code).single()

    if (agent) {
      const { data: existingComm } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).single()

      if (!existingComm) {
        // Get agent's tier for commission rate
        let commissionRate = 0.30 // Default basic

        if (agent.tier_id) {
          const { data: tier } = await supabase
            .from('tiers')
            .select('commission_rate')
            .eq('id', agent.tier_id)
            .single()

          if (tier) commissionRate = tier.commission_rate
        }

        // Use tier rate OR product-specific rate if higher
        const { data: product } = await supabase.from('products').select('commission_rate').eq('id', purchase.product_id).single()
        const productRate = product?.commission_rate
        const finalRate = productRate ? Math.max(commissionRate, productRate) : commissionRate

        const commissionAmount = transaction.amount * finalRate

        console.log(`Creating Commission: ${transaction.amount} * ${finalRate} = ${commissionAmount} for agent ${agent.email}`)

        const { error: commError } = await supabase.from('commissions').insert({
          agent_id: agent.id,
          source_transaction_id: transaction.id,
          amount: commissionAmount
        })

        if (!commError) {
          const { error: rpcError } = await supabase.rpc('increment_balance', { user_id: agent.id, amount: commissionAmount })
          if (rpcError) console.error("RPC Error:", rpcError)
          else console.log("Agent Balance Updated")

          // Increment sales count
          await supabase.rpc('increment_sales', { user_id: agent.id })

          // Check for auto-upgrade
          await supabase.rpc('check_auto_upgrade', { check_user_id: agent.id })

          // VIP Override: Give 5% to upline if upline is VIP
          if (agent.referred_by) {
            const { data: uplineProfile } = await supabase
              .from('profiles')
              .select('tier_id')
              .eq('id', agent.referred_by)
              .single()

            if (uplineProfile?.tier_id) {
              const { data: uplineTier } = await supabase
                .from('tiers')
                .select('override_commission_rate, tier_key')
                .eq('id', uplineProfile.tier_id)
                .single()

              if (uplineTier?.override_commission_rate && uplineTier.tier_key === 'vip') {
                const overrideAmount = transaction.amount * uplineTier.override_commission_rate
                console.log(`VIP Override: Giving ${overrideAmount} to upline ${agent.referred_by}`)

                await supabase.from('commissions').insert({
                  agent_id: agent.referred_by,
                  source_transaction_id: transaction.id,
                  amount: overrideAmount
                })

                await supabase.rpc('increment_balance', { user_id: agent.referred_by, amount: overrideAmount })
              }
            }
          }
        } else {
          console.error("Commission Insert Error:", commError)
        }
      } else {
        console.log("Commission already exists.")
      }
    } else {
      console.log(`Agent code ${purchase.agent_code} provided but agent not found.`)
    }
  }

  // 3. Send Email
  console.log("Serving Email...")
  const { data: product } = await supabase.from('products').select('*').eq('id', purchase.product_id).single()

  if (product) {
    try {
      const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-email`
      await fetch(emailFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          to: purchase.customer_email,
          subject: `Akses Produk: ${product.title}`,
          type: 'product_delivery',
          data: {
            customerName: purchase.customer_name,
            productTitle: product.title,
            fileUrl: product.file_url,
            amount: transaction.amount
          }
        })
      })
      console.log("Email request sent to send-email function.")
    } catch (emailErr) {
      console.error("Error sending email:", emailErr)
    }
  } else {
    console.log("Product not found for email sending.")
  }
}
