import { supabase } from '../lib/supabaseClient'

export default function Home({ courses }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>My Courses</h1>
      <ul>
        {courses.map(c => (
          <li key={c.id}>
            <a href={`/courses/${c.slug}`}>{c.title} — ${(c.price_cents/100).toFixed(2)}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export async function getServerSideProps() {
  const { data: courses } = await supabase.from('courses').select('*')
  return { props: { courses: courses || [] } }
}
