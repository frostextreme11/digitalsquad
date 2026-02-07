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
    const { amount, orderId, customerDetails, userId, leadId, type, referralCode } = await req.json()

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    let finalOrderId = orderId
    let existingTx = null

    // If no orderId provided, check for existing pending transaction or create new one
    if (!finalOrderId) {
      // Resolve Referrer ID from Code if provided
      let resolvedReferrerId = null;
      if (referralCode) {
        // Try to find the profile with this affiliate code
        const { data: refProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('affiliate_code', referralCode)
          .single()

        if (refProfile) {
          resolvedReferrerId = refProfile.id
        }
      }

      // Check for existing PENDING transaction for this user
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type || 'registration')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      existingTx = tx

      if (existingTx) {
        finalOrderId = existingTx.id
        console.log("Found existing pending transaction:", finalOrderId)

        // Ensure profile has referrer if valid referral code was provided and profile lacks it
        if (resolvedReferrerId) {
          const { data: currentProfile } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', userId).single();
          if (currentProfile && !currentProfile.referred_by) {
            console.log(`Patching profile ${userId} with referrer ${resolvedReferrerId} (Existing TX)`)
            await supabaseAdmin.from('profiles').update({ referred_by: resolvedReferrerId }).eq('id', userId)
          }
        }
      } else {
        // Create new transaction
        console.log("Creating new transaction for user:", userId)

        // Ensure profile exists (Edge Function has Admin rights)
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, referred_by')
          .eq('id', userId)
          .single()

        if (existingProfile) {
          // PATCH: Ensure profile has referrer if valid referral code was provided and profile lacks it
          if (resolvedReferrerId && !existingProfile.referred_by) {
            console.log(`Patching profile ${userId} with referrer ${resolvedReferrerId} (New TX, Existing Profile)`)
            await supabaseAdmin.from('profiles').update({ referred_by: resolvedReferrerId }).eq('id', userId)
          }
        } else {
          // Create new profile WITH referrer
          console.log("Profile missing in DB, creating now...")
          await supabaseAdmin.from('profiles').insert({
            id: userId,
            email: customerDetails.email,
            full_name: customerDetails.first_name,
            phone: customerDetails.phone,
            role: 'agent',
            referred_by: resolvedReferrerId // IMPORTANT: Set it on creation
          })
        }

        let finalLeadId = leadId

        // Try to resolve lead_id from email if not provided
        if (!finalLeadId && customerDetails?.email) {
          const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('email', customerDetails.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (lead) {
            finalLeadId = lead.id
            console.log(`Found matching lead record for user: ${finalLeadId}`)
          }
        }

        // If still no lead_id, CREATE one to ensure it's not null (per user request)
        if (!finalLeadId && customerDetails?.email) {
          console.log("No existing lead found. Creating new lead record to fulfill requirement...")

          // Determine referral code
          let leadReferralCode = referralCode;

          if (!leadReferralCode && userId) {
            // Try to get from profile
            const { data: userProf } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', userId).single();
            if (userProf?.referred_by) {
              const { data: refProf } = await supabaseAdmin.from('profiles').select('affiliate_code').eq('id', userProf.referred_by).single();
              if (refProf?.affiliate_code) {
                leadReferralCode = refProf.affiliate_code;
              }
            }
          }

          const { data: newLead, error: leadError } = await supabaseAdmin
            .from('leads')
            .insert({
              email: customerDetails.email,
              full_name: customerDetails.first_name || customerDetails.full_name || 'User',
              phone: customerDetails.phone,
              referred_by_code: leadReferralCode,
              status: 'pending'
            })
            .select('id')
            .single()

          if (newLead) {
            finalLeadId = newLead.id;
            console.log(`Created new lead: ${finalLeadId}`);
          } else {
            console.error("Failed to create auto-lead:", leadError);
          }
        }

        if (!finalLeadId) {
          console.warn("Could not determine lead_id even after creation attempt.");
        }

        const { data: txn, error: txError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            lead_id: finalLeadId,
            amount: amount,
            type: type || 'registration',
            status: 'pending',
            midtrans_id: finalOrderId // We will update this with txn.id
          })
          .select()
          .single()

        if (txError) {
          console.error("Transaction creation failed:", txError)
          throw new Error(`Failed to create transaction: ${txError.message}`)
        }

        // Update midtrans_id to match our internal ID
        if (txn) {
          await supabaseAdmin.from('transactions').update({ midtrans_id: txn.id }).eq('id', txn.id)
        }

        finalOrderId = txn.id
      }
    }

    // Fetch active payment gateway from config
    const { data: gatewayConfig } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'payment_gateway')
      .single()

    const activeGateway = gatewayConfig?.value || 'midtrans'
    console.log(`[Payment] Active Gateway: ${activeGateway}`)

    // Update transaction with payment_gateway info
    await supabaseAdmin
      .from('transactions')
      .update({ payment_gateway: activeGateway })
      .eq('id', finalOrderId)

    // ============ MAYAR GATEWAY ============
    if (activeGateway === 'mayar') {
      console.log("[Payment] Processing with Mayar...")

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
      console.log(`[Mayar] Redirect URL: ${redirectUrl}`)
      console.log(`[Mayar] API Key (first 20 chars): ${mayarApiKey.substring(0, 20)}...`)

      // CHECK: If existing pending transaction already has a mayar_payment_url, return it!
      // This prevents spamming create calls for the same intent.
      if (existingTx && existingTx.mayar_payment_url && existingTx.status === 'pending') {
        console.log(`[Mayar] Reusing existing ACTIVE payment link: ${existingTx.mayar_payment_url}`);
        return new Response(
          JSON.stringify({
            gateway: 'mayar',
            payment_url: existingTx.mayar_payment_url,
            mayar_id: existingTx.mayar_id,
            transaction_id: finalOrderId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
      }

      // Build request payload - Mayar requires: name, amount (int), email, mobile, description, redirectUrl
      const mayarPayload = {
        name: customerDetails?.first_name || 'Customer',
        email: customerDetails?.email || '',
        amount: parseInt(String(amount)),
        mobile: customerDetails?.phone || '081234567890',
        redirectUrl: redirectUrl,
        description: type === 'product_purchase' ? 'Pembayaran produk Digital Squad' : (type === 'tier_upgrade' ? 'Pembayaran Upgrade Tier Digital Squad' : 'Pembayaran pendaftaran member Digital Squad'),
        expiredAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expired
      }
      console.log(`[Mayar] Request Payload:`, JSON.stringify(mayarPayload))

      // Call Mayar API to create payment
      const mayarResponse = await fetch(`${mayarApiUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mayarApiKey}`
        },
        body: JSON.stringify(mayarPayload)
      })

      const mayarData = await mayarResponse.json()
      console.log("[Mayar] Response Status:", mayarResponse.status)
      console.log("[Mayar] Response Body:", JSON.stringify(mayarData))

      if (!mayarResponse.ok || mayarData.statusCode >= 400) {
        console.error("[Mayar] Error:", mayarData)
        // Provide more detailed error message
        const errorDetail = mayarData.message || mayarData.error || mayarData.errors || JSON.stringify(mayarData)
        throw new Error(`Mayar Error: ${errorDetail}`)
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
        .eq('id', finalOrderId)

      console.log(`[Mayar] Payment created. ID: ${mayarTxId}, Link: ${paymentUrl}`)

      return new Response(
        JSON.stringify({
          gateway: 'mayar',
          payment_url: paymentUrl,
          mayar_id: mayarTxId,
          transaction_id: finalOrderId
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    // ============ MIDTRANS GATEWAY ============
    console.log("[Payment] Processing with Midtrans...")

    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) throw new Error('Server Key not found')

    const auth = btoa(serverKey + ':')

    // Fetch API URL from Config
    const { data: config } = await supabaseAdmin
      .from('app_config')
      .select('value')
      .eq('key', 'midtrans_api_url')
      .single()

    // Use sandbox by default, change to production URL for live
    const url = config?.value || 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    // DEBUG: Check for Environment Mismatch
    const isProductionUrl = !url.includes('sandbox')
    const isSandboxKey = serverKey.startsWith('SB-')

    console.log(`[Payment Debug] URL: ${url}`)
    console.log(`[Payment Debug] Key Prefix: ${serverKey.substring(0, 5)}...`)

    if (isProductionUrl && isSandboxKey) {
      console.error("CRITICAL CONFIG ERROR: Using Sandbox Key with Production URL! Update MIDTRANS_SERVER_KEY in Supabase Secrets.")
    } else if (!isProductionUrl && !isSandboxKey) {
      console.warn("WARNING: Using likely Production Key with Sandbox URL.")
    }

    // Construct Webhook URL explicitly to ensure Midtrans hits us
    const webhookUrl = `${supabaseUrl}/functions/v1/midtrans-webhook`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'X-Override-Notification': webhookUrl // Unofficial header, but good practice
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: finalOrderId,
          gross_amount: amount,
        },
        credit_card: {
          secure: true,
        },
        // IMPORTANT: Override Notification URL
        // https://docs.midtrans.com/reference/snap-transactions
        callbacks: {
          finish: "https://digitalsquad.id/dashboard"
        },
        // Note: Snap API doesn't fully support notification_url in payload for all account types, 
        // but it works for Core API. For Snap, we MUST rely on Dashboard or X-Override if supported.
        // HOWEVER, newer Snap docs say skipping `notification_url` is standard. 
        // Let's try to pass it anyway as a top-level property just in case Core API equivalence is active.
        notification_url: [webhookUrl],
        customer_details: customerDetails,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.error_messages?.[0] || 'Midtrans Error';
      if (errorMessage.includes("Order ID is already used") || errorMessage.includes("transaction_details.order_id")) {
        console.log("Order ID used, retrying with new ID...");

        // Let's create a completely new transaction to ensure user can pay.
        const { data: newTxn, error: newTxError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            lead_id: leadId,
            amount: amount,
            type: type || 'registration',
            status: 'pending',
            payment_gateway: 'midtrans'
          })
          .select()
          .single()

        if (newTxError) {
          console.error("New transaction creation failed (Retry):", newTxError)
          throw new Error("Unable to create payment link. Please try again.")
        }

        finalOrderId = newTxn.id
        console.log("Retrying Midtrans with NEW Order ID:", finalOrderId)

        // Retry fetch with new ID
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: newTxn.id,
              gross_amount: amount,
            },
            credit_card: { secure: true },
            customer_details: customerDetails,
            notification_url: [webhookUrl]
          }),
        });

        const retryData = await retryResponse.json();
        if (!retryResponse.ok) throw new Error(retryData.error_messages?.[0] || 'Midtrans Retry Error');

        return new Response(
          JSON.stringify({ ...retryData, gateway: 'midtrans' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
      }

      throw new Error(errorMessage)
    }

    return new Response(
      JSON.stringify({ ...data, gateway: 'midtrans' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
