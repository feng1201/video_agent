'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'

export default function OutlinePage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[] } | null>(null)
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
      setState(s)
      if (s.completedSteps?.includes('outline')) setDone(true)
    })
  }, [projectId])

  async function handleGenerate() {
    setIsStreaming(true)
    setStreaming('')
    await streamFromAPI(
      `/api/project/${projectId}/outline`, {},
      (c) => setStreaming(prev => prev + c),
      () => { setIsStreaming(false); setDone(true) },
      (msg) => { setIsStreaming(false); alert(msg) }
    )
  }

  return (
    <StepLayout projectId={projectId} currentStep="outline" completedSteps={state?.completedSteps ?? []}
      title="第四步：生成分集目录" prevStep="characters"
      description="AI 为每一集生成标题和核心冲突，🔥 关键剧情集，💰 付费卡点集。">
      <div className="space-y-4">
        <StreamingText content={streaming} isStreaming={isStreaming} />
        {done ? (
          <button onClick={() => router.push(`/project/${projectId}/episode`)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg">
            ✅ 分集目录完成 → 开始写剧本
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={isStreaming}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50">
            {isStreaming ? '🤖 AI 正在规划...' : '📋 生成分集目录'}
          </button>
        )}
      </div>
    </StepLayout>
  )
}
