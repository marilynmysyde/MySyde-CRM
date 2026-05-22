import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { amount, title } = await req.json()

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'A deal total is required to generate a payment link.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency:    'usd',
      product_data: { name: title || 'MySyde Kiosk Ad Package' },
    })

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: { custom_message: 'Thank you! Your MySyde kiosk ad package is confirmed. We\'ll be in touch shortly.' },
      },
    })

    return new Response(JSON.stringify({ url: link.url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
