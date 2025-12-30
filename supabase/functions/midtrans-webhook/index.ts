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
      // Robust type check
      const txType = transaction.type || 'registration'; // Default to registration if missing

      if (txType === 'registration') {
        console.log("Processing REGISTRATION success logic...")
        await handleRegistrationSuccess(supabase, transaction)
      } else if (txType === 'product_purchase') {
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
  // 1. Find referrer with robust fail-safety
  console.log("Checking referrer for new user:", transaction.user_id)
  let referrerId = null

  if (transaction.user_id) {
    const { data: profile } = await supabase.from('profiles').select('referred_by, email, full_name').eq('id', transaction.user_id).single()
    if (profile) {
      console.log("Found Profile:", JSON.stringify(profile))
    } else {
      console.log("Profile NOT found for user:", transaction.user_id)
    }

    if (profile?.referred_by) {
      referrerId = profile.referred_by
      console.log("Found referrer DIRECTLY from Profile:", referrerId)
    } else {
      // Fallback: Check Lead-Code Linkage
      console.log("Profile referrer missing (null). Checking Lead/Code linkage...")
      let targetCode = null;

      if (transaction.lead_id) {
        const { data: lead } = await supabase.from('leads').select('referred_by_code').eq('id', transaction.lead_id).single()
        if (lead?.referred_by_code) {
          targetCode = lead.referred_by_code
          console.log("Found code from Linked Transaction Lead:", targetCode)
        }
      }

      if (!targetCode && profile?.email) {
        const { data: leadByEmail } = await supabase
          .from('leads')
          .select('referred_by_code')
          .eq('email', profile.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (leadByEmail?.referred_by_code) {
          targetCode = leadByEmail.referred_by_code
          console.log("Found code from Email Lookup in Leads:", targetCode)
        }
      }

      if (targetCode) {
        console.log("Attempting to resolve code:", targetCode)
        // Check if code maps to an agent profile
        const { data: refProfile } = await supabase.from('profiles').select('id').eq('affiliate_code', targetCode).single()
        if (refProfile) {
          referrerId = refProfile.id
          console.log("Resolved referrer ID from Code:", referrerId)
          // PATCH Profile to PERMANENTLY fix it
          await supabase.from('profiles').update({ referred_by: referrerId }).eq('id', transaction.user_id)
          console.log("Patched user profile with resolved referrer.")
        } else {
          console.warn("Code found but no profile matches affiliate_code:", targetCode)
        }
      }
    }
  }

  // 2. Process Commission if Referrer Found
  if (referrerId) {
    console.log(`Processing commission for Agent ${referrerId}`)

    // Idempotency Check
    const { data: existing } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).maybeSingle()

    if (!existing) {
      // Get Rates
      let commissionRate = 0.30
      let uplineId = null

      const { data: agent } = await supabase.from('profiles').select('tier_id, referred_by').eq('id', referrerId).single()

      if (agent?.tier_id) {
        const { data: tier } = await supabase.from('tiers').select('commission_rate').eq('id', agent.tier_id).single()
        if (tier) commissionRate = tier.commission_rate
      }
      if (agent?.referred_by) uplineId = agent.referred_by

      // Insert Commission
      const commissionAmount = transaction.amount * commissionRate
      console.log(`Commission: ${transaction.amount} * ${commissionRate} = ${commissionAmount}`)

      const { error: commError } = await supabase.from('commissions').insert({
        agent_id: referrerId,
        source_transaction_id: transaction.id,
        amount: commissionAmount
      })

      if (commError) {
        console.error("CRITICAL: Registration Commission Insert Error:", commError)
      } else {
        console.log("Registration Commission Inserted Successfully for Agent:", referrerId)
      }

      // VIP Override
      if (uplineId) {
        const { data: upProfile } = await supabase.from('profiles').select('tier_id').eq('id', uplineId).single()
        if (upProfile?.tier_id) {
          const { data: upTier } = await supabase.from('tiers').select('tier_key, override_commission_rate').eq('id', upProfile.tier_id).single()
          if (upTier?.tier_key === 'vip' && upTier.override_commission_rate) {
            const overrideAmt = transaction.amount * upTier.override_commission_rate
            const { error: vipError } = await supabase.from('commissions').insert({
              agent_id: uplineId,
              source_transaction_id: transaction.id,
              amount: overrideAmt
            })
            if (vipError) {
              console.error("CRITICAL: VIP Override Commission Insert Error:", vipError)
            } else {
              console.log("VIP Override Commission Created")
            }
          }
        }
      }
    } else {
      console.log("Commission already exists.")
    }
  } else {
    console.warn("NO REFERRER FOUND. Commission skipped.")
  }

  // 3. Post-Registration Cleanup / Failsafe for Affiliate Code
  if (transaction.user_id) {
    const { data: p } = await supabase.from('profiles').select('id, tier_id, affiliate_code, email, full_name, referred_by').eq('id', transaction.user_id).single()

    // Failsafe: If referrerId was not found earlier but profile has one now (maybe checking race condition), use it.
    if (!referrerId && p?.referred_by) {
      console.log("Late detection of referrer from profile cleanup:", p.referred_by);
      referrerId = p.referred_by;
      // Retry commission logic for late detection
      // ... (We could call the commission logic block here, but better to restructure code.
      // For now, let's just log it. The main flow above should have caught it if create-payment did its job.)
    }

    if (p && !p.tier_id) {
      const { data: bTier } = await supabase.from('tiers').select('id').eq('tier_key', 'basic').single()
      if (bTier) await supabase.from('profiles').update({ tier_id: bTier.id }).eq('id', transaction.user_id)
      console.log("Backfilled missing tier_id to Basic");
    }

    if (p && !p.affiliate_code) {
      console.log("Backfilling missing affiliate_code for user:", transaction.user_id);

      // Generate clean code: AGUS1234
      let baseName = (p.full_name || p.email || 'USER').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (baseName.length < 3) baseName = 'AGENT';
      baseName = baseName.substring(0, 4);

      let newCode = baseName + Math.floor(Math.random() * 9000 + 1000);

      // Check Uniqueness (Simple check, if fail, we rely on next webhook or user profile load to fix)
      const { data: duplicate } = await supabase.from('profiles').select('id').eq('affiliate_code', newCode).maybeSingle();
      if (duplicate) {
        newCode = baseName + Math.floor(Math.random() * 9000 + 1000); // Retry once
      }

      const { error: codeError } = await supabase.from('profiles').update({ affiliate_code: newCode }).eq('id', transaction.user_id);
      if (codeError) console.error("Failed to backfill affiliate code:", codeError);
      else console.log("Backfilled affiliate code to:", newCode);
    }
  }

  // RE-RUN COMMISSION LOGIC IF Late Detection Happened
  if (referrerId) {
    const { data: existing } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).maybeSingle()
    if (!existing) {
      console.log("Retrying Commission Insertion for Agent (Late/Normal):", referrerId)

      // Get Rates
      let commissionRate = 0.30
      let uplineId = null

      const { data: agent } = await supabase.from('profiles').select('tier_id, referred_by').eq('id', referrerId).single()

      if (agent?.tier_id) {
        const { data: tier } = await supabase.from('tiers').select('commission_rate').eq('id', agent.tier_id).single()
        if (tier) commissionRate = tier.commission_rate
      }
      if (agent?.referred_by) uplineId = agent.referred_by

      // Insert Commission
      const commissionAmount = transaction.amount * commissionRate

      const { error: commError } = await supabase.from('commissions').insert({
        agent_id: referrerId,
        source_transaction_id: transaction.id,
        amount: commissionAmount
      })

      if (commError) {
        console.error("CRITICAL: Commission Insert Error:", commError)
      } else {
        console.log("Commission Inserted Successfully.")
      }

      // VIP Override Logic (Simplified Copy)
      if (uplineId) {
        const { data: upProfile } = await supabase.from('profiles').select('tier_id').eq('id', uplineId).single()
        if (upProfile?.tier_id) {
          const { data: upTier } = await supabase.from('tiers').select('tier_key, override_commission_rate').eq('id', upProfile.tier_id).single()
          if (upTier?.tier_key === 'vip' && upTier.override_commission_rate) {
            const overrideAmt = transaction.amount * upTier.override_commission_rate
            await supabase.from('commissions').insert({
              agent_id: uplineId,
              source_transaction_id: transaction.id,
              amount: overrideAmt
            })
            console.log("VIP Override Commission Created")
          }
        }
      }
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
          console.log(`Commission created for agent ${agent.id}. DB Trigger will handle Balance & Sales updates.`)

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

                console.log("VIP Commission inserted.")
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
