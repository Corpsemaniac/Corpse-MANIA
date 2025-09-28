import Stripe from 'stripe'
import { supabase } from '../../lib/supabaseClient'
import getRawBody from 'raw-body'

export const config = {
  api: { bodyParser: false }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const buf = await getRawBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    await supabase
      .from('purchases')
      .update({
        status: 'paid',
        stripe_payment_intent: session.payment_intent,
        purchased_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id)
    console.log('Payment confirmed for', session.id)
  }

  res.json({ received: true })
}
