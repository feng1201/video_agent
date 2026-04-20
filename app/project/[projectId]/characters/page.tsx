'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'

export default function CharactersPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[] } | null>(null)
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
      setState(s)
      if (s.completedSteps?.includes('characters')) setDone(true)
    })
  }, [projectId])

  useEffect(() => {
    if (!done || !streaming || !mermaidRef.current) return
    const match = streaming.match(/```mermaid\n([\s\S]*?)```/)
    if (!match) return
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
      const id = 'mermaid-' + Date.now()
      mermaid.render(id, match[1]).then(({ svg }) => {
        if (mermaidRef.current) mermaidRef.current.innerHTML = svg
      }).catch(() => {
        if (mermaidRef.current) mermaidRef.current.innerHTML = '<p class="text-gray-400 text-sm">关系图渲染失败，请查看文字版本</p>'
      })
    })
  }, [done, streaming])

  async function handleGenerate() {
    setIsStreaming(true)
    setStreaming('')
    setDone(false)
    await streamFromAPI(
      `/api/project/${projectId}/characters`, {},
      (c) => setStreaming(prev => prev + c),
      () => { setIsStreaming(false); setDone(true) },
      (msg) => { setIsStreaming(false); alert(msg) }
    )
  }

  return (
    <StepLayout projectId={projectId} currentStep="characters" completedSteps={state?.completedSteps ?? []}
      title="第三步：塑造角色体系" prevStep="plan"
      description="AI 将创建完整的角色档案，包含性格、动机、爽点功能，以及可视化的角色关系图。">
      <div className="space-y-4">
        <StreamingText content={streaming} isStreaming={isStreaming} />
        {(streaming || done) && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">角色关系图</h3>
            <div ref={mermaidRef}
              className="bg-white border rounded-lg p-4 min-h-32 flex items-center justify-center text-gray-400 text-sm overflow-auto">
              {isStreaming ? '生成中，请稍候...' : (!done ? '等待生成' : '正在渲染关系图...')}
            </div>
          </div>
        )}
        {done ? (
          <button onClick={() => router.push(`/project/${projectId}/outline`)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg">
            ✅ 角色完成 → 规划分集目录
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={isStreaming}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50">
            {isStreaming ? '🤖 AI 正在创造角色...' : '👥 生成角色体系'}
          </button>
        )}
      </div>
    </StepLayout>
  )
}
