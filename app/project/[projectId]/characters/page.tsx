'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'

function extractMermaidCode(text: string): string | null {
  // 支持多种格式：```mermaid、``` mermaid、前后有空格等
  const match = text.match(/```\s*mermaid\s*\n([\s\S]*?)```/)
  return match ? match[1].trim() : null
}

export default function CharactersPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[] } | null>(null)
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null)
  const [mermaidError, setMermaidError] = useState(false)
  const mermaidContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
      setState(s)
      if (s.completedSteps?.includes('characters')) setDone(true)
    })
  }, [projectId])

  // 渲染 Mermaid，在 done 且有内容时触发
  useEffect(() => {
    if (!done || !streaming) return
    const code = extractMermaidCode(streaming)
    if (!code) { setMermaidError(true); return }

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })
      const id = 'mermaid-graph-' + Date.now()
      mermaid.render(id, code)
        .then(({ svg }) => setMermaidSvg(svg))
        .catch((err) => {
          console.error('Mermaid render error:', err)
          setMermaidError(true)
        })
    })
  }, [done, streaming])

  // 将 SVG 插入 DOM（使用 ref 避免 React 重渲覆盖）
  useEffect(() => {
    if (mermaidSvg && mermaidContainerRef.current) {
      mermaidContainerRef.current.innerHTML = mermaidSvg
    }
  }, [mermaidSvg])

  async function handleGenerate() {
    setIsStreaming(true)
    setStreaming('')
    setDone(false)
    setMermaidSvg(null)
    setMermaidError(false)
    await streamFromAPI(
      `/api/project/${projectId}/characters`, {},
      (c) => setStreaming(prev => prev + c),
      () => { setIsStreaming(false); setDone(true) },
      (msg) => { setIsStreaming(false); alert(msg) }
    )
  }

  const mermaidCode = done ? extractMermaidCode(streaming) : null

  return (
    <StepLayout projectId={projectId} currentStep="characters" completedSteps={state?.completedSteps ?? []}
      title="第三步：塑造角色体系" prevStep="plan"
      description="AI 将创建完整的角色档案，包含性格、动机、爽点功能，以及可视化的角色关系图。">
      <div className="space-y-4">
        <StreamingText content={streaming} isStreaming={isStreaming} />

        {(streaming || done) && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">角色关系图</h3>
            {isStreaming && (
              <div className="bg-gray-50 border rounded-lg p-4 text-center text-gray-400 text-sm min-h-24">
                生成中，请稍候...
              </div>
            )}
            {!isStreaming && done && !mermaidSvg && !mermaidError && (
              <div className="bg-gray-50 border rounded-lg p-4 text-center text-gray-400 text-sm min-h-24">
                正在渲染关系图...
              </div>
            )}
            {/* Mermaid SVG 容器 — 用 ref 管理，避免 React 重渲覆盖 */}
            <div
              ref={mermaidContainerRef}
              className={`bg-white border rounded-lg p-4 overflow-auto ${mermaidSvg ? '' : 'hidden'}`}
            />
            {mermaidError && mermaidCode && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">关系图语法预览（渲染失败）：</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{mermaidCode}</pre>
              </div>
            )}
            {mermaidError && !mermaidCode && (
              <div className="bg-gray-50 border rounded-lg p-3 text-gray-400 text-sm">
                AI 未生成标准关系图格式，请查看上方文字版角色档案。
              </div>
            )}
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
