import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
    to: string
    subject: string
    type: 'product_delivery' | 'purchase_confirmation'
    data: any
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, type, data }: EmailRequest = await req.json()
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set')
        }

        let htmlContent = ''

        if (type === 'product_delivery') {
            htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Terima Kasih atas Pembelian Anda!</h1>
          <p>Halo ${data.customerName},</p>
          <p>Terima kasih telah membeli <strong>${data.productTitle}</strong>.</p>
          <p>Berikut adalah link akses untuk produk Anda:</p>
          <div style="margin: 30px 0;">
            <a href="${data.fileUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Produk</a>
          </div>
          <p>Atau copy link berikut:</p>
          <p>${data.fileUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 14px;">Jika tombol di atas tidak berfungsi, silakan hubungi support kami.</p>
        </div>
      `
        } else {
            htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Pembelian Berhasil</h1>
          <p>Halo ${data.customerName},</p>
          <p>Pembayaran Anda untuk <strong>${data.productTitle}</strong> telah berhasil dikonfirmasi.</p>
          <p>Total: Rp ${data.amount.toLocaleString()}</p>
          <p>Silakan cek email terpisah untuk link download produk Anda.</p>
        </div>
        `
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Digital Squad <onboarding@resend.dev>', // UPDATE THIS TO YOUR VERIFIED DOMAIN
                to: [to],
                subject: subject,
                html: htmlContent,
            }),
        })

        const responseData = await res.json()

        if (!res.ok) {
            throw new Error(responseData.message || 'Failed to send email')
        }

        return new Response(
            JSON.stringify(responseData),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
