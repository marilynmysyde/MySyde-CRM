// supabase/functions/renewal-alerts/index.ts
// Sends renewal alert emails for deals expiring within 14 days.
//
// Deploy:  supabase functions deploy renewal-alerts
// Secrets:
//   supabase secrets set RESEND_API_KEY=re_your_key_here
//   supabase secrets set ALERT_EMAIL=you@yourdomain.com
//
// Schedule via Supabase Dashboard → Edge Functions → renewal-alerts → Schedule
// Recommended: daily at 8am  →  cron: "0 8 * * *"
//
// Or invoke manually:
//   supabase functions invoke renewal-alerts

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendKey      = Deno.env.get('RESEND_API_KEY')
  const alertEmail     = Deno.env.get('ALERT_EMAIL')
  const fromEmail      = Deno.env.get('FROM_EMAIL') ?? 'alerts@mysyde.com'
  const supabase       = createClient(supabaseUrl, serviceRoleKey)

  const today   = new Date()
  const in14    = new Date(today)
  in14.setDate(in14.getDate() + 14)

  const todayStr = today.toISOString().slice(0, 10)
  const in14Str  = in14.toISOString().slice(0, 10)

  // Find deals with renewal_alert in the next 14 days
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, title, run_end, renewal_alert, partners(name)')
    .gte('renewal_alert', todayStr)
    .lte('renewal_alert', in14Str)
    .neq('stage', 'closed_lost')
    .order('renewal_alert', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (!deals || deals.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No renewals due in the next 14 days.' }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Build email body
  const rows = deals.map(d => {
    const daysLeft = Math.ceil(
      (new Date(d.renewal_alert).getTime() - today.getTime()) / 86_400_000
    )
    return `• ${d.title} (${d.partners?.name ?? '—'}) — renews ${d.run_end}, alert in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
  }).join('\n')

  const emailBody = `MySyde Connect — Renewal Alerts\n\nThe following deals are approaching their renewal window:\n\n${rows}\n\nLog in to review: https://mysyde.com\n`

  // Send via Resend if configured
  let emailSent = false
  if (resendKey && alertEmail) {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `MySyde Connect <${fromEmail}>`,
        to:      [alertEmail],
        subject: `⚠️ ${deals.length} deal${deals.length === 1 ? '' : 's'} renewing soon — MySyde Connect`,
        text:    emailBody,
      }),
    })
    emailSent = emailRes.ok
  }

  return new Response(
    JSON.stringify({
      sent:      emailSent ? deals.length : 0,
      deals:     deals.length,
      email_sent: emailSent,
      message:   emailSent
        ? `Alert sent for ${deals.length} deal(s)`
        : `Found ${deals.length} deal(s) — set RESEND_API_KEY and ALERT_EMAIL to enable emails`,
    }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
