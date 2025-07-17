import { prisma } from '@/lib/db'

export default async function DebugPage() {
  const guides = await prisma.guide.findMany({
    include: { region: true }
  })
  
  const years = await prisma.guide.findMany({
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  })
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Page</h1>
      
      <h2>Available Years:</h2>
      <ul>
        {years.map((y, i) => (
          <li key={i}>{y.year}</li>
        ))}
      </ul>
      
      <h2>All Guides:</h2>
      <ul>
        {guides.map(guide => (
          <li key={guide.id}>
            Year: {guide.year} | Region: {guide.region.name} | Title: {guide.title}
          </li>
        ))}
      </ul>
    </div>
  )
}