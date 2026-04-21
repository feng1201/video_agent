import { NextRequest, NextResponse } from 'next/server'
import { readProjectFile, projectExists } from '@/lib/state'

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'missing name' }, { status: 400 })
  if (!await projectExists(projectId)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const content = await readProjectFile(projectId, name).catch(() => null)
  if (content === null) return NextResponse.json({ error: 'file not found' }, { status: 404 })
  return NextResponse.json({ content })
}
