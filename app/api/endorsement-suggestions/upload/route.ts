import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { validateCsrfToken } from '@/lib/auth/csrf'

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp']
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8 MB

async function getAuthenticatedUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie) return null

  const payload = verifyToken(sessionCookie.value)
  if (!payload) return null

  return await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true }
  })
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!validateCsrfToken(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const formData = await request.formData()
    const candidateId = (formData.get('candidateId') ?? '').toString().trim()
    const endorser = (formData.get('endorser') ?? '').toString().trim()
    const forAgainst = (formData.get('forAgainst') ?? 'FOR').toString().toUpperCase()
    const url = (formData.get('url') ?? '').toString().trim()
    const sourceTitle = (formData.get('sourceTitle') ?? '').toString().trim()
    const notes = (formData.get('notes') ?? '').toString().trim()
    const file = formData.get('file')

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 })
    }

    if (!endorser) {
      return NextResponse.json({ error: 'Endorser name is required' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File upload is required' }, { status: 400 })
    }

    if (!['FOR', 'AGAINST'].includes(forAgainst)) {
      return NextResponse.json({ error: 'Invalid endorsement position' }, { status: 400 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, electionYear: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large (max 8MB)' }, { status: 400 })
    }

    const originalName = file.name || 'endorsement'
    const ext = originalName.split('.').pop()?.toLowerCase() || 'pdf'
    const fullExt = `.${ext}`

    if (!ALLOWED_EXTENSIONS.includes(fullExt)) {
      return NextResponse.json({
        error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
      }, { status: 400 })
    }

    const baseName = slugify(`${endorser}-${Date.now()}`)
    const fileName = `endorsements/pending/${candidate.electionYear}/${baseName}.${ext}`

    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({
      success: true,
      filePath: blob.url,
      url: url || null,
      sourceTitle: sourceTitle || null,
      notes: notes || null,
      forAgainst
    })
  } catch (error) {
    console.error('Endorsement upload error:', error)
    return NextResponse.json({ error: 'Failed to upload endorsement file' }, { status: 500 })
  }
}
