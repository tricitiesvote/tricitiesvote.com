import { getAvailableYears } from '@/lib/queries'
import Link from 'next/link'

export default async function HomePage() {
  const years = await getAvailableYears()
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Tri-Cities Vote</h1>
      <p>Nonpartisan voter guides for Tri-Cities elections</p>
      
      <h2>Available Years:</h2>
      {years.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {years.map(year => (
            <li key={year} style={{ margin: '10px' }}>
              <Link href={`/${year}`} style={{ fontSize: '20px' }}>
                {year} Election Guide
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No election data available. The database may need to be populated.</p>
      )}
    </div>
  )
}