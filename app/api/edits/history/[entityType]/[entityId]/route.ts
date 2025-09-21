import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const { entityType, entityId } = params;

    const edits = await prisma.edit.findMany({
      where: {
        entityType: entityType.toUpperCase() as any,
        entityId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        moderator: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ edits });

  } catch (error) {
    console.error('Get entity history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch edit history' },
      { status: 500 }
    );
  }
}
