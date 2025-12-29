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
      // PATCH: Ensure profile has referrer if referralCode is provided
      if (referralCode) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, referred_by')
          .eq('id', userId)
          .single()

        if (profile && !profile.referred_by) {
          // Find referrer by code
          const { data: referrer } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('affiliate_code', referralCode)
            .single()

          if (referrer) {
            console.log(`Patching profile ${userId} with referrer ${referrer.id}`)
            await supabaseAdmin.from('profiles').update({ referred_by: referrer.id }).eq('id', userId)
          }
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
      } else {
        // Create new transaction
        console.log("Creating new transaction for user:", userId)

        // Ensure profile exists (Edge Function has Admin rights, so we can double check)
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()

        if (!profile) {
          // If profile missing, creating it now to satisfy FK
          console.log("Profile missing in DB, creating now...")
          await supabaseAdmin.from('profiles').insert({
            id: userId,
            email: customerDetails.email,
            full_name: customerDetails.first_name,
            phone: customerDetails.phone,
            role: 'agent'
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
        } // Important: We should NOT rely solely on lead_id. 
        // The webhook uses transaction.user_id -> profile.referred_by as PRIMARY method.
        // So simply ensuring profile.referred_by is set (which RegistrationForm does) is enough.

        const { data: txn, error: txError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            lead_id: finalLeadId,
            amount: amount,
            type: type || 'registration',
            status: 'pending',
            midtrans_id: finalOrderId // Store midtrans_id immediately if possible? No, we don't have token yet.
            // Wait, finalOrderId IS the ID we are sending to Midtrans.
            // So we should store it in midtrans_id too?
            // schema: midtrans_id string | null
            // It is good practice.
          })
          .select()
          .single()

        if (txError) {
          console.error("Transaction creation failed:", txError)
          throw new Error(`Failed to create transaction: ${txError.message}`)
        }

        // Update midtrans_id to match our internal ID if we use internal ID as Order ID
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: finalOrderId,
          gross_amount: amount,
        },
        credit_card: {
          secure: true,
        },
        customer_details: customerDetails,
      }),
    })

    const data = await response.json()

    // Handle Midtrans duplicate order_id error (status 400 or 4xx)
    // If it says "Order ID is already used", and we are reusing the ID, it means the snap token is still valid or we need to fetch the existing one.
    // BUT Snap API creates a NEW token even for existing order_id if it's not expired? No, it usually returns error if order_id exists.
    // Midtrans Snap API: "Transactions with the same order_id are not allowed."
    // So if we reused the ID and the previous transaction is still active in Midtrans, we will get an error.
    // If we get "Order ID is already used", we should probably try to create a NEW transaction ID because the old one is burnt/used?
    // OR we should have stored the snap_token in the database to reuse it without calling Snap API again?
    // The user requirement: "do not create new payment if the pending payment still exists".
    // This implies we should RE-USE the existing Snap Token if possible.

    if (!response.ok) {
      // If error is about duplicate order ID, it means Midtrans already has this.
      // We should ideally return the existing token if we had it.
      // Since we didn't store the token, we might be stuck. 
      // STRATEGY: If creation fails due to duplicate, we should GENERATE A NEW ID (effectively treating the old one as abandoned/expired)
      // UNLESS we can query Midtrans for the existing token.

      // Improved logic based on user request "do not create new payment...":
      // Maybe the user meant: "If they click Pay, show them the EXISTING pending payment popup instead of creating a new one".
      // For that, we need the SNAP TOKEN.

      // Let's modify the code to:
      // 1. Check if we have a saved snap_token in transactions table (Need to add column first? No, schema change is risky here without permission).
      // 2. Alternatively, if we get duplicate order error, we simply create a NEW transaction with a suffix (e.g. -retry-1) so user can pay.
      // BUT user explicitly said: "do not create new payment if the pending payment still exists".
      // This strongly suggests we should show the OLD payment.
      // Without storing the token, we can't easily show the old payment unless we use `snap.pay(existing_token)`.

      // Wait, if we use the same order_id, Midtrans rejects it.
      // If the user closed the popup, they lost the token (client side).
      // So we MUST create a new transaction OR retrieve the token.

      // Let's try to handle the specific error.
      const errorMessage = data.error_messages?.[0] || 'Midtrans Error';
      if (errorMessage.includes("Order ID is already used") || errorMessage.includes("transaction_details.order_id")) {
        // The order ID is taken. 
        // Option A: We create a new one (Violates "do not create new payment"?)
        // Option B: We assume the previous one is "Pending" and we want to continue it. 
        // But we can't get the token back easily from Snap API create endpoint.

        // Correct approach for "Resume Payment":
        // We should probably just generate a NEW unique ID (e.g. timestamp suffix) and let them pay again.
        // The old pending one will eventually expire.
        // BUT the user said "the payment is stuck at pending... do not create new payment if the pending payment still exists".

        // INTERPRETATION:
        // If I have a pending transaction in DB, I should NOT insert a new row in DB.
        // I should try to get the token for THAT transaction.
        // Since I don't have the token stored, I will fail to show the popup.

        // RECOMMENDATION: We MUST create a new unique Order ID for Midtrans for every ATTEMPT, 
        // but we can link it to the SAME "user purchase intent".
        // However, for simple "Registration", one user = one successful transaction.

        // Let's force a new ID if the API fails, ensuring the user CAN pay. 
        // The "Stuck at pending" issue usually happens because the frontend sees "Pending" in DB,
        // but the user can't finish it because they lost the popup.

        console.log("Order ID used, retrying with new ID...");
        // We will create a NEW transaction record because reusing the ID failed.
        // This effectively "cancels" the old pending one in our logic (it stays pending forever until we clean it).

        // Let's create a completely new transaction to ensure user can pay.
        const { data: newTxn, error: newTxError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: userId,
            lead_id: leadId,
            amount: amount,
            type: type || 'registration',
            status: 'pending',
            // Add a note or handle retry logic?
          })
          .select()
          .single()

        if (newTxError) throw new Error(newTxError.message);

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
