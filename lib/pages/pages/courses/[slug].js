import { supabase } from '../../lib/supabaseClient'
import { useState } from 'react'

export default function CoursePage({ course }) {
  const [loading, setLoading] = useState(false)

  if (!course) return <p style={{padding:20}}>Course not found</p>

  async function handleBuy() {
    setLoading(true)
    // For a real site you'd require user to be logged in; this is minimal
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id })
    })
    const data = await res.json()
    setLoading(false)
    if (data.url) window.location = data.url
    else alert('Error starting checkout')
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      <p>Price: ${(course.price_cents/100).toFixed(2)}</p>
      <button onClick={handleBuy} disabled={loading}>
        {loading ? 'Redirecting...' : 'Buy Now'}
      </button>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  const { slug } = ctx.params
  const { data: course } = await supabase.from('courses').select('*').eq('slug', slug).single()
  return { props: { course: course || null } }
}
