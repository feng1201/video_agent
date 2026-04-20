import { NextResponse } from 'next/server'
import { readState, projectExists } from '@/lib/state'

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
): Promise<NextResponse> {
  const { projectId } = params
  if (!(await projectExists(projectId))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  const state = await readState(projectId)
  return NextResponse.json(state)
}
