'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'

export default function EpisodePage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[]; completedEpisodes: number[]; totalEpisodes: number } | null>(null)
  const [epNum, setEpNum] = useState(1)
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
      setState(s)
      const next = (s.completedEpisodes?.length ?? 0) + 1
      setEpNum(Math.min(next, s.totalEpisodes ?? 60))
    })
  }, [projectId])

  async function handleGenerate() {
    setIsStreaming(true)
    setStreaming('')
    await streamFromAPI(
      `/api/project/${projectId}/episode`,
      { episode: epNum },
      (c) => setStreaming(prev => prev + c),
      () => {
        setIsStreaming(false)
        fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
          setState(s)
          const next = (s.completedEpisodes?.length ?? 0) + 1
          setEpNum(Math.min(next, s.totalEpisodes ?? 60))
        })
      },
      (msg) => { setIsStreaming(false); alert(msg) }
    )
  }

  const completed = state?.completedEpisodes ?? []

  return (
    <StepLayout projectId={projectId} currentStep="episode" completedSteps={state?.completedSteps ?? []}
      title="第五步：生成分集剧本" prevStep="outline"
      description="逐集生成完整剧本，每集包含场景、台词、景别和音乐提示。">
      <div className="space-y-4">
        {completed.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            ✅ 已完成：第 {completed.slice(0, 10).join('、')} 集{completed.length > 10 ? `...共${completed.length}集` : ''}
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="font-semibold text-gray-700">生成第</label>
          <input type="number" min={1} max={state?.totalEpisodes ?? 100} value={epNum}
            onChange={e => setEpNum(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 w-20 text-center font-bold text-lg" />
          <span className="text-gray-500">集（共 {state?.totalEpisodes ?? '—'} 集）</span>
        </div>
        <StreamingText content={streaming} isStreaming={isStreaming} />
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={isStreaming}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
            {isStreaming ? `🤖 正在写第${epNum}集...` : `✍️ 生成第${epNum}集`}
          </button>
          {completed.length >= 1 && (
            <button onClick={() => router.push(`/project/${projectId}/review`)}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">
              📊 去评审剧本
            </button>
          )}
        </div>
      </div>
    </StepLayout>
  )
}
