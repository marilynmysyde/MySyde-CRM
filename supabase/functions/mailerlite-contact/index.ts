// supabase/functions/mailerlite-contact/index.ts
// Proxies MailerLite API — keeps the API key server-side only.
// Deploy:  supabase functions deploy mailerlite-contact
// Secret:  supabase secrets set MAILERLITE_API_KEY=your_key_here
//
// Request body (JSON):
//   { "email": "user@example.com" }          ← look up by email
//   { "mailerlite_id": "1234567890" }        ← look up by ML subscriber ID
//
// Response:
//   { status, open_rate, click_rate, last_campaign, subscribed_at } | { error }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  const ML_KEY = Deno.env.get('MAILERLITE_API_KEY')
  if (!ML_KEY) {
    return new Response(JSON.stringify({ error: 'MAILERLITE_API_KEY not configured' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  let body: { email?: string; mailerlite_id?: string }
  try { body = await req.json() } catch { body = {} }

  const { email, mailerlite_id } = body
  if (!email && !mailerlite_id) {
    return new Response(JSON.stringify({ error: 'Provide email or mailerlite_id' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // MailerLite v2 API
  const lookup = email
    ? `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`
    : `https://connect.mailerlite.com/api/subscribers/${mailerlite_id}`

  const mlRes = await fetch(lookup, {
    headers: {
      'Authorization': `Bearer ${ML_KEY}`,
      'Content-Type':  'application/json',
    },
  })

  if (!mlRes.ok) {
    const err = await mlRes.text()
    return new Response(JSON.stringify({ error: `MailerLite error: ${err}` }), {
      status: mlRes.status, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { data: sub } = await mlRes.json()

  // Shape the response to what the frontend needs
  const result = {
    status:          sub.status ?? 'unknown',
    subscribed_at:   sub.subscribed_at ?? null,
    open_rate:       sub.open_rate?.value  ?? null,
    click_rate:      sub.click_rate?.value ?? null,
    last_campaign:   sub.last_campaign?.name ?? null,
    last_clicked_at: sub.last_clicked_at ?? null,
    last_opened_at:  sub.last_opened_at  ?? null,
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
