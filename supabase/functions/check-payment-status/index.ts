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
    const { transaction_id, order_id } = await req.json()
    const targetId = transaction_id || order_id // flexible

    if (!targetId) throw new Error("Missing transaction_id")

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Check Product Purchase Record
    const { data: purchase, error: purchaseError } = await supabase
      .from('product_purchases')
      .select(`
            status, 
            product_id,
            products (
                title,
                file_url
            )
        `)
      .eq('transaction_id', targetId)
      .maybeSingle()

    // If purchase found and success, return immediately
    if (purchase && purchase.status === 'success') {
      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            status: 'success',
            product_title: purchase.products?.title,
            file_url: purchase.products?.file_url
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // 2. If not success (or not found yet?), check Midtrans Status
    // This handles "Pending" -> "Success" transition if webhook hasn't fired yet
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) throw new Error('Server Key not found')
    const auth = btoa(serverKey + ':')

    // Midtrans API
    const midtransUrl = `https://api.sandbox.midtrans.com/v2/${targetId}/status`
    // Note: targetId is the UUID we sent as order_id to Midtrans

    const mtResponse = await fetch(midtransUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    })

    const mtData = await mtResponse.json()
    console.log("Midtrans Status Check:", mtData.transaction_status)

    let status = 'pending'
    if (mtData.transaction_status == 'capture' && mtData.fraud_status == 'accept') {
      status = 'success'
    } else if (mtData.transaction_status == 'settlement') {
      status = 'success'
    } else if (['cancel', 'deny', 'expire', 'failure'].includes(mtData.transaction_status)) {
      status = 'failed'
    }

    if (status === 'success') {
      // Update Transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .update({ status: 'success', midtrans_id: targetId })
        .eq('id', targetId)
        .select()
        .single()

      if (txError) console.error("Update Tx Error", txError)

      await supabase.from('product_purchases').update({ status: 'success' }).eq('transaction_id', targetId)

      // --- Commission Logic (Failsafe) ---
      if (transaction && transaction.type === 'product_purchase') {
        // 1. Identify Agent (Referrer)
        let referrerId = null
        let customerName = "Customer"

        // Try to find purchaser details to get name for email
        const { data: purchase } = await supabase.from('product_purchases').select('*').eq('transaction_id', targetId).single()
        if (purchase) customerName = purchase.customer_name

        // Determine Referrer
        if (transaction.user_id) {
          const { data: profile } = await supabase.from('profiles').select('referred_by').eq('id', transaction.user_id).single()
          if (profile?.referred_by) referrerId = profile.referred_by
        }

        // If not found via user_id (guest checkout), check lead_id
        if (!referrerId && transaction.lead_id) {
          const { data: lead } = await supabase.from('leads').select('referred_by_code').eq('id', transaction.lead_id).single()
          if (lead?.referred_by_code) {
            const { data: referrer } = await supabase.from('profiles').select('id').eq('affiliate_code', lead.referred_by_code).single()
            if (referrer) referrerId = referrer.id
          }
          // Double check specific agent_code on purchase
          if (purchase?.agent_code && !referrerId) {
            const { data: referrer } = await supabase.from('profiles').select('id').eq('affiliate_code', purchase.agent_code).single()
            if (referrer) referrerId = referrer.id
          }
        }

        // 2. Apply Commission
        if (referrerId) {
          const { data: existing } = await supabase.from('commissions').select('id').eq('source_transaction_id', targetId).single()
          if (!existing) {
            // Get Product Price/Commission Rate (Assuming 50% for now or fetch product)
            const { data: product } = await supabase.from('products').select('commission_rate').eq('id', purchase.product_id).single()
            const rate = product?.commission_rate || 0.5
            const commissionAmount = transaction.amount * rate

            const { error: commError } = await supabase.from('commissions').insert({
              agent_id: referrerId,
              source_transaction_id: transaction.id,
              amount: commissionAmount
            })

            if (!commError) {
              await supabase.rpc('increment_balance', { user_id: referrerId, amount: commissionAmount })
              console.log("Commission applied:", commissionAmount)
            } else {
              console.error("Commission Error", commError)
            }
          }
        }

        // 3. Trigger Email (via send-email function)
        if (purchase) {
          const { data: product } = await supabase.from('products').select('*').eq('id', purchase.product_id).single()
          if (product) {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                to: [purchase.customer_email],
                subject: `Akses Produk: ${product.title}`,
                type: 'product_delivery',
                data: {
                  customerName: purchase.customer_name,
                  productTitle: product.title,
                  fileUrl: product.file_url // Direct link
                }
              })
            })
          }
        }
      }

      // Fetch product details again to get URL
      const { data: updatedPurchase } = await supabase
        .from('product_purchases')
        .select(`status, products(title, file_url)`)
        .eq('transaction_id', targetId)
        .single()

      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            status: 'success',
            product_title: updatedPurchase?.products?.title,
            file_url: updatedPurchase?.products?.file_url
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    return new Response(
      JSON.stringify({ status: 'pending', midtrans_status: mtData.transaction_status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
