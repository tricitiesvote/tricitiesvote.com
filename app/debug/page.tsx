import { prisma } from '@/lib/db'

export default async function DebugPage() {
  const guides = await prisma.guide.findMany({
    include: { region: true }
  })
  
  const years = await prisma.guide.findMany({
    select: { electionYear: true },
    distinct: ['electionYear'],
    orderBy: { electionYear: 'desc' }
  })
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Page</h1>
      
      <h2>Available Years:</h2>
      <ul>
        {years.map((y, i) => (
          <li key={i}>{y.electionYear}</li>
        ))}
      </ul>
      
      <h2>All Guides:</h2>
      <ul>
        {guides.map(guide => (
          <li key={guide.id}>
            Year: {guide.electionYear} | Region: {guide.region.name} | Type: {guide.type}
          </li>
        ))}
      </ul>
    </div>
  )
}