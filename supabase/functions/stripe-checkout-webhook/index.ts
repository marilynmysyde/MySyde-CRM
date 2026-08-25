// supabase/functions/stripe-checkout-webhook/index.ts
//
// Bridges self-serve Stripe checkout (the 14 kiosk package/a-la-carte
// payment links built 2026-08-24) to MySyde Connect and Mailerlite, so a
// prospect scanning a QR and paying on the spot doesn't go silent.
//
// On checkout.session.completed for one of the 14 known launch payment
// links:
//   1. Find-or-create the Partner + Contact in Supabase (business_name /
//      contact_name / email come from required custom fields added to the
//      checkout — see 2026-08-24 decision log entry)
//   2. Create the Deal at stage='creative' with the correct
//      placement_type / package_key / pricing from the catalog below
//   3. Move the Mailerlite contact into Business - Kiosk Active Advertiser
//      (+ VIP - Founding Advertiser), setting advertiser_type=paid_launch
//      and the kiosk_ad_* fields — this is what fires Funnel 5
//   4. Emails Marilyn via Resend so a closed sale is never silent
//
// Sessions from unrelated payment links (e.g. the CRM's own ad-hoc
// stripe-payment-link function) simply won't match the catalog below and
// are skipped — this endpoint only acts on the 14 known launch links.
//
// Deploy:  supabase functions deploy stripe-checkout-webhook
// Secrets (STRIPE_SECRET_KEY / MAILERLITE_API_KEY / RESEND_API_KEY /
// ALERT_EMAIL already set for other functions in this project):
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...   ← after registering the endpoint in Stripe
//
// Register in Stripe: Developers → Webhooks → Add endpoint
//   URL: https://wyguubkjefkefqosguio.supabase.co/functions/v1/stripe-checkout-webhook
//   Event: checkout.session.completed

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

// payment_link id -> catalog entry. Built from
// projects/active/morgan-hill-kiosk-launch/2026-08-24-stripe-checkout-links.md
const CATALOG: Record<string, {
  name: string
  placement_type: string
  package_key: string | null
  monthly_rate: number
  months: number
}> = {
  'plink_1U857mHOeq1BATmxvLOAgV2z': { name: 'Morgan Hill Takeover',    placement_type: 'package', package_key: 'morgan_hill_takeover', monthly_rate: 4848.00, months: 6 },
  'plink_1U857nHOeq1BATmxzy8jrjEy': { name: 'Downtown Headliner',      placement_type: 'package', package_key: 'downtown_headliner',    monthly_rate: 1788.00, months: 3 },
  'plink_1U857oHOeq1BATmxeG5dv7ZS': { name: 'Downtown Pop',            placement_type: 'package', package_key: 'downtown_pop',          monthly_rate: 748.00,  months: 3 },
  'plink_1U857pHOeq1BATmx9uDbi1kz': { name: 'Main Street Moment',      placement_type: 'package', package_key: 'main_street_moment',    monthly_rate: 263.00,  months: 3 },
  'plink_1U857qHOeq1BATmxjZlrAO7G': { name: 'Local Spark',             placement_type: 'package', package_key: 'local_spark',           monthly_rate: 140.00,  months: 3 },
  'plink_1U857rHOeq1BATmxMQTmr9Zn': { name: 'Primary Wrap — Main Face',              placement_type: 'primary_wrap',    package_key: null, monthly_rate: 1250.00, months: 6 },
  'plink_1U857sHOeq1BATmxB35cU6Zc': { name: 'Complete Middle-Screen Takeover',       placement_type: 'middle_takeover', package_key: null, monthly_rate: 1625.00, months: 3 },
  'plink_1U857tHOeq1BATmxwFYuisb0': { name: 'Welcome Featured Sponsor Box',          placement_type: 'featured_box',    package_key: null, monthly_rate: 375.00,  months: 3 },
  'plink_1U857uHOeq1BATmxN5LyuEOX': { name: 'Dynamic Top Banner',                    placement_type: 'top_banner',      package_key: null, monthly_rate: 225.00,  months: 3 },
  'plink_1U857vHOeq1BATmxwxyFsDFs': { name: 'Dynamic Bottom Banner',                 placement_type: 'bottom_banner',   package_key: null, monthly_rate: 175.00,  months: 3 },
  'plink_1U857wHOeq1BATmxOiZ3euA3': { name: 'Sponsored Search Button',               placement_type: 'search_button',   package_key: null, monthly_rate: 200.00,  months: 3 },
  'plink_1U857xHOeq1BATmxnawVqsmx': { name: 'Side Panel QR Sponsor Tile (one side)', placement_type: 'side_qr_tile',    package_key: null, monthly_rate: 225.00,  months: 6 },
  'plink_1U857yHOeq1BATmx3x7AZqXo': { name: 'Stand Out Map Bundle',                  placement_type: 'map_bundle',      package_key: null, monthly_rate: 187.50,  months: 3 },
  'plink_1U857yHOeq1BATmx1x8WYO7b': { name: 'Featured Event (weekly)',               placement_type: 'featured_event',  package_key: null, monthly_rate: 50.00,   months: 1 },
}

const ML_GROUP_ACTIVE_ADVERTISER = '195527647292294804' // Business - Kiosk Active Advertiser
const ML_GROUP_VIP_FOUNDING      = '195527648490816538' // VIP - Founding Advertiser

async function mailerliteUpsert(email: string, fields: Record<string, string>) {
  const ML_KEY = Deno.env.get('MAILERLITE_API_KEY')
  if (!ML_KEY) return

  await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ML_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      fields,
      groups: [ML_GROUP_ACTIVE_ADVERTISER, ML_GROUP_VIP_FOUNDING],
    }),
  })
}

async function notifyMarilyn(subject: string, text: string) {
  const resendKey  = Deno.env.get('RESEND_API_KEY')
  const alertEmail = Deno.env.get('ALERT_EMAIL')
  const fromEmail  = Deno.env.get('FROM_EMAIL') ?? 'alerts@mysyde.com'
  if (!resendKey || !alertEmail) return

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `MySyde Connect <${fromEmail}>`,
      to:   [alertEmail],
      subject,
      text,
    }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const rawBody = await req.text()

  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Webhook not configured (missing signature or STRIPE_WEBHOOK_SECRET)' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)
  } catch (err) {
    return new Response(JSON.stringify({ error: `Signature verification failed: ${err.message}` }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ skipped: true, reason: `ignoring event type ${event.type}` }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const session = event.data.object
  const paymentLinkId = session.payment_link as string | null
  const catalogEntry = paymentLinkId ? CATALOG[paymentLinkId] : undefined

  if (!catalogEntry) {
    // Not one of the 14 known launch links (e.g. an ad-hoc CRM-generated
    // payment link from stripe-payment-link) — not ours to handle.
    return new Response(JSON.stringify({ skipped: true, reason: 'payment_link not in launch catalog' }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const email = session.customer_details?.email ?? null
    const customFields: Array<{ key: string; text?: { value?: string } }> = session.custom_fields ?? []
    const businessName = customFields.find((f) => f.key === 'business_name')?.text?.value?.trim() || 'Unknown business — review needed'
    const contactName  = customFields.find((f) => f.key === 'contact_name')?.text?.value?.trim()  || 'Unknown — review needed'

    if (!email) {
      await notifyMarilyn(
        `⚠️ Kiosk sale with no email — ${catalogEntry.name}`,
        `A ${catalogEntry.name} checkout completed (session ${session.id}) but Stripe returned no customer email. Check the Stripe dashboard and enter this deal manually.`,
      )
      return new Response(JSON.stringify({ error: 'No customer email on session' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Idempotency — Stripe can redeliver the same event. Skip if a deal
    // for this exact session already exists.
    const { data: existing } = await supabase
      .from('deals')
      .select('id')
      .ilike('notes', `%${session.id}%`)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ skipped: true, reason: 'already processed', deal_id: existing.id }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Find-or-create partner
    let partnerId: string
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id')
      .ilike('name', businessName)
      .maybeSingle()

    if (existingPartner) {
      partnerId = existingPartner.id
    } else {
      const { data: newPartner, error: partnerErr } = await supabase
        .from('partners')
        .insert({ name: businessName, type: 'local_business', notes: 'Auto-created from self-serve Stripe checkout.' })
        .select('id')
        .single()
      if (partnerErr) throw partnerErr
      partnerId = newPartner.id
    }

    // Find-or-create contact
    let contactId: string
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact, error: contactErr } = await supabase
        .from('contacts')
        .insert({ name: contactName, email, partner_id: partnerId })
        .select('id')
        .single()
      if (contactErr) throw contactErr
      contactId = newContact.id
    }

    // Create the deal
    const today = new Date()
    const runEnd = new Date(today)
    runEnd.setMonth(runEnd.getMonth() + catalogEntry.months)

    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .insert({
        title: `${businessName} — ${catalogEntry.name}`,
        contact_id: contactId,
        partner_id: partnerId,
        stage: 'creative',
        placement_type: catalogEntry.placement_type,
        package_key: catalogEntry.package_key,
        pricing_tier: 'option_2',
        launch_pricing: true,
        monthly_rate: catalogEntry.monthly_rate,
        months: catalogEntry.months,
        design_status: 'none',
        run_start: today.toISOString().slice(0, 10),
        run_end: runEnd.toISOString().slice(0, 10),
        stripe_payment_link: session.url ?? `https://buy.stripe.com/${paymentLinkId}`,
        notes: `Auto-created from self-serve Stripe checkout. Session: ${session.id}. Review placement_type/package_key and confirm run dates.`,
      })
      .select('id')
      .single()
    if (dealErr) throw dealErr

    // Mailerlite — Funnel 5 trigger
    await mailerliteUpsert(email, {
      name: contactName,
      business_name: businessName,
      advertiser_type: 'paid_launch',
      kiosk_ad_placement: catalogEntry.name,
      kiosk_ad_start_date: today.toISOString().slice(0, 10),
      kiosk_ad_end_date: runEnd.toISOString().slice(0, 10),
    })

    // Notify Marilyn — no closed sale should be silent
    await notifyMarilyn(
      `💰 New self-serve kiosk sale — ${catalogEntry.name}`,
      `${businessName} (${contactName}, ${email}) just paid for ${catalogEntry.name} at $${catalogEntry.monthly_rate}/mo.\n\nCRM deal created (stage: creative) — review and confirm run dates: https://crm.mysyde.com\nMailerlite: moved into Business - Kiosk Active Advertiser, Funnel 5 will start automatically.`,
    )

    return new Response(JSON.stringify({ success: true, deal_id: deal.id }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
