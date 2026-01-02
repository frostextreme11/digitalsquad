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

        // 4. Update Transaction with Midtrans ID (We use txn.id as Order ID)
        const orderId = txn.id
        await supabaseAdmin.from('transactions').update({ midtrans_id: orderId }).eq('id', txn.id)

        // 5. Call Midtrans Snap API
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
            JSON.stringify({ token: midtransData.token, redirect_url: midtransData.redirect_url, transaction_id: txn.id }),
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
