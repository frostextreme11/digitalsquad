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
        const { productId, customerDetails, agentCode, userId } = await req.json()

        // Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

        // 1. Get Product Details
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('is_active', true)
            .single()

        if (productError || !product) {
            console.error("Product fetch error:", productError)
            throw new Error('Product not found or inactive')
        }

        console.log(`Processing purchase for product: ${product.title} (ID: ${product.id}), Price: ${product.price}`)

        if (product.price === undefined || product.price === null) {
            throw new Error(`Product price is invalid: ${product.price}`)
        }

        const amount = Number(product.price)

        // 1.5 Capture Lead
        // Check if lead exists
        let leadId = null
        const { data: existingLead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('email', customerDetails.email)
            .maybeSingle()

        if (existingLead) {
            leadId = existingLead.id
            // Optional: Update lead info if needed?
        } else {
            // Create new lead
            const { data: newLead, error: leadError } = await supabaseAdmin
                .from('leads')
                .insert({
                    full_name: customerDetails.first_name,
                    email: customerDetails.email,
                    phone: customerDetails.phone,
                    referred_by_code: agentCode, // If agentCode is null, it's organic
                    status: 'pending' // They are pending until they pay (or maybe just considered a lead regardless)
                })
                .select()
                .single()

            if (!leadError && newLead) {
                leadId = newLead.id
            } else {
                console.error("Failed to create lead:", leadError)
                // We don't block payment if lead creation fails, but good to know
            }
        }

        // 2. Create Transaction Record
        // We create the transaction first to get an ID for Midtrans
        const { data: txn, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: userId || null, // Updated to use userId if provided
                lead_id: leadId,
                amount: amount,
                type: 'product_purchase',
                status: 'pending',
                midtrans_id: crypto.randomUUID() // Temporary ID until we have one? Or use this as OrderID
            })
            .select()
            .single()

        if (txError) {
            console.error("Transaction Creation Error:", txError)
            throw new Error(`Failed to create transaction: ${txError.message}`)
        }

        // 3. Create Product Purchase Record
        const { error: purchaseError } = await supabaseAdmin
            .from('product_purchases')
            .insert({
                product_id: product.id,
                user_id: userId || null, // Link to user
                transaction_id: txn.id,
                customer_name: customerDetails.first_name,
                customer_email: customerDetails.email,
                customer_phone: customerDetails.phone,
                agent_code: agentCode,
                status: 'pending'
            })

        if (purchaseError) throw new Error(`Failed to track purchase: ${purchaseError.message}`)

        // 4. Update Transaction with order ID (We use txn.id as Order ID)
        const orderId = txn.id

        // Fetch active payment gateway from config
        const { data: gatewayConfig } = await supabaseAdmin
            .from('app_config')
            .select('value')
            .eq('key', 'payment_gateway')
            .single()

        const activeGateway = gatewayConfig?.value || 'midtrans'
        console.log(`[Product Payment] Active Gateway: ${activeGateway}`)

        // Update transaction with payment_gateway info
        await supabaseAdmin
            .from('transactions')
            .update({ midtrans_id: orderId, payment_gateway: activeGateway })
            .eq('id', txn.id)

        // ============ MAYAR GATEWAY ============
        if (activeGateway === 'mayar') {
            console.log("[Product Payment] Processing with Mayar...")

            const mayarApiKey = Deno.env.get('MAYAR_API_KEY')
            if (!mayarApiKey) throw new Error('Mayar API Key not found')

            // Fetch Mayar config
            const { data: mayarUrlConfig } = await supabaseAdmin
                .from('app_config')
                .select('value')
                .eq('key', 'mayar_api_url')
                .single()

            const { data: mayarRedirectConfig } = await supabaseAdmin
                .from('app_config')
                .select('value')
                .eq('key', 'mayar_redirect_url')
                .single()

            // For staging use api.mayar.club, for production use api.mayar.id
            const mayarApiUrl = mayarUrlConfig?.value || 'https://api.mayar.club/hl/v1'
            const redirectUrl = mayarRedirectConfig?.value || 'https://digitalsquad.id/payment-success'

            console.log(`[Mayar] API URL: ${mayarApiUrl}`)

            // Call Mayar API to create payment
            const mayarResponse = await fetch(`${mayarApiUrl}/payment/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mayarApiKey}`
                },
                body: JSON.stringify({
                    name: customerDetails?.first_name || 'Customer',
                    email: customerDetails?.email || '',
                    amount: parseInt(String(amount)),
                    mobile: customerDetails?.phone || '081234567890',
                    redirectUrl: redirectUrl,
                    description: `Pembayaran produk: ${product.title}`,
                })
            })

            const mayarData = await mayarResponse.json()
            console.log("[Mayar] Response:", JSON.stringify(mayarData))

            if (!mayarResponse.ok || mayarData.statusCode >= 400) {
                console.error("[Mayar] Error:", mayarData)
                throw new Error(mayarData.message || mayarData.error || 'Mayar Error')
            }

            // Extract Mayar transaction ID and payment link
            const mayarTxId = mayarData.data?.id
            const paymentUrl = mayarData.data?.link

            if (!paymentUrl) {
                throw new Error('Mayar did not return a payment link')
            }

            // Update transaction with Mayar ID and payment URL
            await supabaseAdmin
                .from('transactions')
                .update({ mayar_id: mayarTxId, mayar_payment_url: paymentUrl })
                .eq('id', txn.id)

            console.log(`[Mayar] Product Payment created. ID: ${mayarTxId}, Link: ${paymentUrl}`)

            return new Response(
                JSON.stringify({
                    gateway: 'mayar',
                    payment_url: paymentUrl,
                    mayar_id: mayarTxId,
                    transaction_id: txn.id
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            )
        }

        // ============ MIDTRANS GATEWAY ============
        console.log("[Product Payment] Processing with Midtrans...")

        const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
        if (!serverKey) throw new Error('Server Key not found')

        const auth = btoa(serverKey + ':')

        // Fetch API URL from Config
        const { data: config } = await supabaseAdmin
            .from('app_config')
            .select('value')
            .eq('key', 'midtrans_api_url')
            .single()

        const midtransUrl = config?.value || 'https://app.sandbox.midtrans.com/snap/v1/transactions'

        // DEBUG: Check for Environment Mismatch
        const isProductionUrl = !midtransUrl.includes('sandbox')
        const isSandboxKey = serverKey.startsWith('SB-')

        console.log(`[Product Payment] URL: ${midtransUrl}`)
        console.log(`[Product Payment] Key Prefix: ${serverKey.substring(0, 5)}...`)

        if (isProductionUrl && isSandboxKey) {
            console.error("CRITICAL CONFIG ERROR: Using Sandbox Key with Production URL! Update MIDTRANS_SERVER_KEY.")
        }

        const response = await fetch(midtransUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                transaction_details: {
                    order_id: orderId,
                    gross_amount: product.price,
                },
                credit_card: { secure: true },
                customer_details: {
                    first_name: customerDetails.first_name,
                    email: customerDetails.email,
                    phone: customerDetails.phone,
                },
                item_details: [{
                    id: product.id,
                    price: product.price,
                    quantity: 1,
                    name: product.title.substring(0, 50)
                }]
            }),
        })

        const midtransData = await response.json()

        if (!response.ok) {
            console.error("Midtrans Error:", midtransData)
            throw new Error(midtransData.error_messages?.[0] || 'Midtrans Error')
        }

        return new Response(
            JSON.stringify({ token: midtransData.token, redirect_url: midtransData.redirect_url, transaction_id: txn.id, gateway: 'midtrans' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error("Create Product Payment Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
