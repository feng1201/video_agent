import { NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'
import { writeState } from '@/lib/state'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)

export async function POST(): Promise<NextResponse> {
  const projectId = nanoid()
  await writeState(projectId, {
    projectId,
    currentStep: 'start',
    completedSteps: [],
    genre: [],
    audience: '',
    tone: '',
    ending: '',
    totalEpisodes: 0,
    completedEpisodes: [],
    language: 'zh-CN',
    mode: 'domestic',
    dramaTitle: '',
    createdAt: new Date().toISOString(),
  })
  return NextResponse.json({ projectId })
}
