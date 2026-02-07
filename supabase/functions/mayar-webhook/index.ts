import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-token',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verify Webhook Token
        const webhookToken = Deno.env.get('MAYAR_WEBHOOK_TOKEN')
        const receivedToken = req.headers.get('x-callback-token')

        console.log("----------------------------------------")
        console.log("Mayar Webhook Received")
        console.log("----------------------------------------")

        if (webhookToken && receivedToken !== webhookToken) {
            console.error("Invalid webhook token received:", receivedToken?.substring(0, 20) + "...")
            return new Response("Unauthorized", { status: 401, headers: corsHeaders })
        }

        const notification = await req.json()
        console.log("Mayar Notification:", JSON.stringify(notification))

        // Mayar webhook structure:
        // { event: "payment.received", data: { id, status, amount, customerEmail, link, ... } }
        const { event, data } = notification

        if (!event || !data) {
            console.error("Invalid webhook payload - missing event or data")
            return new Response("Invalid payload", { status: 400, headers: corsHeaders })
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Extract Mayar IDs - the webhook has different IDs:
        // - data.id / transactionId = payment transaction ID (new for each payment)
        // - data.productId = payment link/product ID (what we stored as mayar_id)
        const mayarTxId = data.id || data.transactionId
        const mayarProductId = data.productId
        const mayarStatus = (data.status || '').toUpperCase() // Normalize to uppercase
        const amount = data.amount || data.amountReceived || data.nettAmount

        console.log(`Event: ${event} | Tx ID: ${mayarTxId} | Product ID: ${mayarProductId} | Status: ${mayarStatus} | Amount: ${amount}`)

        if (event === 'payment.reminder') {
            console.log("Skipping payment.reminder event to prevent status overwrites.")
            return new Response(
                JSON.stringify({ status: 'ignored', message: 'payment.reminder event is ignored' }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        // Find transaction by mayar_id - try multiple IDs
        let existingTx = null
        let findError = null

        // First try by productId (this is what we stored from payment creation)
        if (mayarProductId) {
            console.log("Trying productId:", mayarProductId)
            const result1 = await supabase
                .from('transactions')
                .select('*')
                .eq('mayar_id', mayarProductId)
                .maybeSingle()
            existingTx = result1.data
            findError = result1.error
        }

        // If not found, try by transaction ID
        if (!existingTx && mayarTxId) {
            console.log("Trying transaction ID:", mayarTxId)
            const result2 = await supabase
                .from('transactions')
                .select('*')
                .eq('mayar_id', mayarTxId)
                .maybeSingle()
            existingTx = result2.data
            findError = result2.error
        }

        if (findError) {
            console.error("Error finding transaction:", findError)
            throw new Error("Database error finding transaction")
        }

        if (!existingTx) {
            console.error("Transaction NOT FOUND for productId:", mayarProductId, "or txId:", mayarTxId)
            // Log all transactions for debugging
            const { data: allTx } = await supabase
                .from('transactions')
                .select('id, mayar_id, status, payment_gateway')
                .eq('payment_gateway', 'mayar')
                .order('created_at', { ascending: false })
                .limit(5)
            console.log("Recent Mayar transactions:", JSON.stringify(allTx))
            return new Response("Transaction not found", { status: 404, headers: corsHeaders })
        }

        console.log(`Transaction Found: ${existingTx.id} | Type: ${existingTx.type} | Current Status: ${existingTx.status}`)

        // Map Mayar status to our status - handle uppercase
        let status = 'pending'
        if (event === 'payment.received' || mayarStatus === 'SUCCESS' || mayarStatus === 'PAID') {
            status = 'success'
        } else if (mayarStatus === 'FAILED' || mayarStatus === 'EXPIRED' || mayarStatus === 'CANCELLED') {
            status = 'failed'
        } else if (mayarStatus === 'PENDING') {
            status = 'pending'
        }

        console.log(`Mapped Status: ${mayarStatus} -> ${status}`)

        // Update transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .update({ status: status })
            .eq('id', existingTx.id)
            .select()
            .single()

        if (txError) {
            console.error("Transaction update failed:", txError)
            throw new Error("Transaction update failed")
        }

        console.log(`Transaction Updated to: ${status}`)

        // Process success logic based on type
        if (status === 'success') {
            const txType = transaction.type || 'registration'

            if (txType === 'registration') {
                console.log("Processing REGISTRATION success logic...")
                await handleRegistrationSuccess(supabase, transaction)
            } else if (txType === 'product_purchase') {
                console.log("Processing PRODUCT PURCHASE success logic...")
                await handleProductPurchaseSuccess(supabase, transaction, supabaseUrl, supabaseKey)
            } else if (txType === 'tier_upgrade') {
                console.log("Processing TIER UPGRADE success logic...")
                await handleTierUpgradeSuccess(supabase, transaction)
            }
        } else {
            console.log(`Status is ${status}, skipping success logic.`)
        }

        return new Response(
            JSON.stringify({ status: 'ok' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("MAYAR WEBHOOK ERROR:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})

async function handleRegistrationSuccess(supabase: any, transaction: any) {
    // 1. Find referrer
    console.log("Checking referrer for new user:", transaction.user_id)
    let referrerId = null

    if (transaction.user_id) {
        const { data: profile } = await supabase.from('profiles').select('referred_by, email, full_name').eq('id', transaction.user_id).single()

        if (profile?.referred_by) {
            referrerId = profile.referred_by
            console.log("Found referrer from Profile:", referrerId)
        } else if (transaction.lead_id) {
            // Check lead for referral code
            const { data: lead } = await supabase.from('leads').select('referred_by_code').eq('id', transaction.lead_id).single()
            if (lead?.referred_by_code) {
                const { data: refProfile } = await supabase.from('profiles').select('id').eq('affiliate_code', lead.referred_by_code).single()
                if (refProfile) {
                    referrerId = refProfile.id
                    await supabase.from('profiles').update({ referred_by: referrerId }).eq('id', transaction.user_id)
                    console.log("Resolved and patched referrer:", referrerId)
                }
            }
        }
    }

    // 2. Process Commission
    if (referrerId) {
        console.log(`Processing commission for Agent ${referrerId}`)

        const { data: existing } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).maybeSingle()

        if (!existing) {
            let commissionRate = 0.30
            let uplineId = null

            const { data: agent } = await supabase.from('profiles').select('tier_id, referred_by').eq('id', referrerId).single()

            if (agent?.tier_id) {
                const { data: tier } = await supabase.from('tiers').select('commission_rate').eq('id', agent.tier_id).single()
                if (tier) commissionRate = tier.commission_rate
            }
            if (agent?.referred_by) uplineId = agent.referred_by

            const commissionAmount = transaction.amount * commissionRate
            console.log(`Commission: ${transaction.amount} * ${commissionRate} = ${commissionAmount}`)

            const { error: commError } = await supabase.from('commissions').insert({
                agent_id: referrerId,
                source_transaction_id: transaction.id,
                amount: commissionAmount
            })

            if (commError) {
                console.error("Commission Insert Error:", commError)
            } else {
                console.log("Commission Inserted Successfully")
            }

            // VIP Override
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
        } else {
            console.log("Commission already exists.")
        }
    } else {
        console.warn("NO REFERRER FOUND. Commission skipped.")
    }

    // 3. Backfill affiliate_code if missing
    if (transaction.user_id) {
        const { data: p } = await supabase.from('profiles').select('id, tier_id, affiliate_code, email, full_name').eq('id', transaction.user_id).single()

        if (p && !p.tier_id) {
            const { data: bTier } = await supabase.from('tiers').select('id').eq('tier_key', 'basic').single()
            if (bTier) await supabase.from('profiles').update({ tier_id: bTier.id }).eq('id', transaction.user_id)
            console.log("Backfilled missing tier_id to Basic")
        }

        if (p && !p.affiliate_code) {
            let baseName = (p.full_name || p.email || 'USER').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
            if (baseName.length < 3) baseName = 'AGENT'
            baseName = baseName.substring(0, 4)

            let newCode = baseName + Math.floor(Math.random() * 9000 + 1000)

            const { data: duplicate } = await supabase.from('profiles').select('id').eq('affiliate_code', newCode).maybeSingle()
            if (duplicate) {
                newCode = baseName + Math.floor(Math.random() * 9000 + 1000)
            }

            await supabase.from('profiles').update({ affiliate_code: newCode }).eq('id', transaction.user_id)
            console.log("Backfilled affiliate code to:", newCode)
        }
    }
}

async function handleProductPurchaseSuccess(supabase: any, transaction: any, supabaseUrl: string, supabaseKey: string) {
    // 1. Update product_purchases
    const { data: purchase, error: purchaseError } = await supabase
        .from('product_purchases')
        .update({ status: 'success' })
        .eq('transaction_id', transaction.id)
        .select()
        .single()

    if (purchaseError || !purchase) {
        console.error("Error updating product_purchases:", purchaseError)
        return
    }

    console.log("Product Purchase Updated to SUCCESS")

    // 2. Commission Logic
    if (purchase.agent_code) {
        const { data: agent } = await supabase.from('profiles').select('id, email, tier_id, referred_by').eq('affiliate_code', purchase.agent_code).single()

        if (agent) {
            const { data: existingComm } = await supabase.from('commissions').select('id').eq('source_transaction_id', transaction.id).single()

            if (!existingComm) {
                let commissionRate = 0.30

                if (agent.tier_id) {
                    const { data: tier } = await supabase.from('tiers').select('commission_rate').eq('id', agent.tier_id).single()
                    if (tier) commissionRate = tier.commission_rate
                }

                const { data: product } = await supabase.from('products').select('commission_rate').eq('id', purchase.product_id).single()
                const productRate = product?.commission_rate
                const finalRate = productRate ? Math.max(commissionRate, productRate) : commissionRate

                const commissionAmount = transaction.amount * finalRate

                console.log(`Creating Commission: ${transaction.amount} * ${finalRate} = ${commissionAmount}`)

                const { error: commError } = await supabase.from('commissions').insert({
                    agent_id: agent.id,
                    source_transaction_id: transaction.id,
                    amount: commissionAmount
                })

                if (!commError) {
                    console.log(`Commission created for agent ${agent.id}`)

                    // VIP Override
                    if (agent.referred_by) {
                        const { data: uplineProfile } = await supabase.from('profiles').select('tier_id').eq('id', agent.referred_by).single()

                        if (uplineProfile?.tier_id) {
                            const { data: uplineTier } = await supabase.from('tiers').select('override_commission_rate, tier_key').eq('id', uplineProfile.tier_id).single()

                            if (uplineTier?.override_commission_rate && uplineTier.tier_key === 'vip') {
                                const overrideAmount = transaction.amount * uplineTier.override_commission_rate
                                await supabase.from('commissions').insert({
                                    agent_id: agent.referred_by,
                                    source_transaction_id: transaction.id,
                                    amount: overrideAmount
                                })
                                console.log("VIP Commission inserted.")
                            }
                        }
                    }
                }
            }
        }
    }

    // 3. Send Email
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
            console.log("Email request sent.")
        } catch (emailErr) {
            console.error("Error sending email:", emailErr)
        }
    }
}

async function handleTierUpgradeSuccess(supabase: any, transaction: any) {
    console.log(`Processing TIER UPGRADE logic for user: ${transaction.user_id} with amount: ${transaction.amount}`)

    // Find tier by upgrade_price matching transaction amount
    const { data: tier, error } = await supabase
        .from('tiers')
        .select('id, name')
        .eq('upgrade_price', transaction.amount)
        .maybeSingle();

    if (error) {
        console.error("Error finding tier by price:", error);
        return;
    }

    if (tier) {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ tier_id: tier.id })
            .eq('id', transaction.user_id);

        if (updateError) {
            console.error("Failed to update user tier:", updateError);
        } else {
            console.log(`✅ User ${transaction.user_id} upgraded to tier ${tier.name} (${tier.id})`);
        }
    } else {
        console.error(`❌ No tier found for upgrade price: ${transaction.amount}`);
    }
}

