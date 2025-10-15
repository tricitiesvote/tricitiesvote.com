import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get('raceId');
    const year = searchParams.get('year');

    if (!raceId && !year) {
      return NextResponse.json({ error: 'Either raceId or year parameter required' }, { status: 400 });
    }

    let engagements;

    if (raceId) {
      // Fetch engagements for this specific race
      engagements = await prisma.engagement.findMany({
        where: {
          raceId: raceId
        },
        select: {
          id: true,
          slug: true,
          title: true,
          linkType: true,
          primaryLink: true
        },
        orderBy: [
          { date: 'desc' },
          { title: 'asc' }
        ]
      });
    } else if (year) {
      // Fetch all engagements for candidates in this election year
      const yearInt = parseInt(year, 10);
      if (isNaN(yearInt)) {
        return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
      }

      // Get all races for this year, then get their engagements
      const races = await prisma.race.findMany({
        where: { electionYear: yearInt },
        select: { id: true }
      });

      const raceIds = races.map(r => r.id);

      engagements = await prisma.engagement.findMany({
        where: {
          OR: [
            { raceId: { in: raceIds } },
            { raceId: null } // Include engagements not tied to specific races
          ]
        },
        select: {
          id: true,
          slug: true,
          title: true,
          linkType: true,
          primaryLink: true
        },
        orderBy: [
          { date: 'desc' },
          { title: 'asc' }
        ]
      });
    }

    return NextResponse.json({ engagements });
  } catch (error) {
    console.error('Engagements API error:', error);
    return NextResponse.json({ error: 'Failed to fetch engagements' }, { status: 500 });
  }
}
