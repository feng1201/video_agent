'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'

export default function PlanPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[]; genre: string[]; audience: string; tone: string } | null>(null)
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
      setState(s)
      if (s.completedSteps?.includes('plan')) setDone(true)
    })
  }, [projectId])

  async function handleGenerate() {
    setIsStreaming(true)
    setStreaming('')
    await streamFromAPI(
      `/api/project/${projectId}/plan`, {},
      (c) => setStreaming(prev => prev + c),
      () => { setIsStreaming(false); setDone(true) },
      (msg) => { setIsStreaming(false); alert(msg) }
    )
  }

  return (
    <StepLayout projectId={projectId} currentStep="plan" completedSteps={state?.completedSteps ?? []}
      title="第二步：生成故事骨架" prevStep="start"
      description="AI 将为你生成完整的故事方案，包含三幕结构、付费卡点规划、爽点矩阵和结局设计。">
      <div className="space-y-4">
        {state && (
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            💡 基于你选择的：<strong>{state.genre?.join('+') || '—'} · {state.audience} · {state.tone}</strong>
          </div>
        )}
        <StreamingText content={streaming} isStreaming={isStreaming} />
        {done ? (
          <button onClick={() => router.push(`/project/${projectId}/characters`)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg">
            ✅ 故事方案完成 → 开始塑造角色
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={isStreaming}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50">
            {isStreaming ? '🤖 AI 正在构建故事...' : '✍️ 生成故事骨架'}
          </button>
        )}
      </div>
    </StepLayout>
  )
}
