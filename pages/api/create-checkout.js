import Stripe from 'stripe'
import { supabase } from '../../lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { courseId } = req.body

  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
  if (error || !course) return res.status(400).json({ error: 'Course not found' })

  const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: course.currency || 'usd',
          product_data: { name: course.title },
          unit_amount: course.price_cents
        },
        quantity: 1
      }],
      mode: 'payment',
      metadata: { course_id: course.id.toString() },
      success_url: `${YOUR_DOMAIN}/dashboard`,
      cancel_url: `${YOUR_DOMAIN}/courses/${course.slug}`
    })

    await supabase.from('purchases').insert([{
      user_id: null,
      course_id: course.id,
      stripe_session_id: session.id,
      status: 'created'
    }])

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Stripe error' })
  }
}
