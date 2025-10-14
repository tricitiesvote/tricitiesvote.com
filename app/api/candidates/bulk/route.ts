import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      );
    }

    const candidates = await prisma.candidate.findMany({
      where: {
        id: { in: ids }
      },
      select: {
        id: true,
        name: true,
        electionYear: true
      }
    });

    // Generate slugs from names
    const candidatesWithSlugs = candidates.map(c => ({
      id: c.id,
      name: c.name,
      slug: slugify(c.name),
      year: c.electionYear
    }));

    return NextResponse.json({ candidates: candidatesWithSlugs });
  } catch (error) {
    console.error('Bulk candidates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}
