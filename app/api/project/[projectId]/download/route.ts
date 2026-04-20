import { NextResponse } from 'next/server'
import { projectExists, readState, listEpisodes } from '@/lib/state'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
): Promise<Response> {
  const { projectId } = params
  if (!(await projectExists(projectId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const state = await readState(projectId)
  const title = state.dramaTitle || '未命名短剧'
  const exportDir = path.join(process.cwd(), 'data', 'projects', projectId, 'export')

  try {
    const files = await fs.readdir(exportDir)
    const mdFile = files.find(f => f.endsWith('.md'))
    if (!mdFile) {
      return NextResponse.json({ error: 'Export not yet generated' }, { status: 404 })
    }
    const content = await fs.readFile(path.join(exportDir, mdFile), 'utf-8')
    return new Response(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(mdFile)}`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export file not found' }, { status: 404 })
  }
}
