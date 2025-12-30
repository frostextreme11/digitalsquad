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
      const { data: existingTx } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type || 'registration')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

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

    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!serverKey) throw new Error('Server Key not found')

    const auth = btoa(serverKey + ':')

    // Use sandbox by default, change to production URL for live
    const url = 'https://app.sandbox.midtrans.com/snap/v1/transactions'

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
          JSON.stringify(retryData),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
      }

      throw new Error(errorMessage)
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
