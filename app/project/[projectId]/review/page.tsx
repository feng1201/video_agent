'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

function parseScores(text: string) {
  const dims = ['节奏', '爽点', '台词', '格式', '连贯性']
  return dims.map(dim => {
    const match = text.match(new RegExp(`${dim}[^|]*\\|[^|]*?(\\d+)/10`))
    return { subject: dim, score: match ? parseInt(match[1], 10) : 0 }
  })
}

export default function ReviewPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[]; completedEpisodes: number[] } | null>(null)
  const [epNum, setEpNum] = useState(1)
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [scores, setScores] = useState<{ subject: string; score: number }[]>([])

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
      setState(s)
      if (s.completedEpisodes?.length > 0) setEpNum(s.completedEpisodes[0])
    })
  }, [projectId])

  useEffect(() => {
    if (streaming) {
      const parsed = parseScores(streaming)
      if (parsed.some(s => s.score > 0)) setScores(parsed)
    }
  }, [streaming])

  async function handleReview() {
    setIsStreaming(true)
    setStreaming('')
    setScores([])
    await streamFromAPI(
      `/api/project/${projectId}/review`,
      { episode: epNum },
      (c) => setStreaming(prev => prev + c),
      () => setIsStreaming(false),
      (msg) => { setIsStreaming(false); alert(msg) }
    )
  }

  const completed = state?.completedEpisodes ?? []

  return (
    <StepLayout projectId={projectId} currentStep="review" completedSteps={state?.completedSteps ?? []}
      title="第六步：质量评审" prevStep="episode"
      description="AI 对剧本进行5维度质量评分，生成详细问题清单和修改建议。">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="font-semibold text-gray-700">评审第</label>
          <select value={epNum} onChange={e => setEpNum(Number(e.target.value))}
            className="border rounded-lg px-3 py-2">
            {completed.map((ep: number) => (
              <option key={ep} value={ep}>第{ep}集</option>
            ))}
          </select>
          {completed.length === 0 && <span className="text-gray-400 text-sm">请先生成剧本</span>}
        </div>

        {scores.length > 0 && scores.some(s => s.score > 0) && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-center">5维评分雷达图</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={scores} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13 }} />
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        <StreamingText content={streaming} isStreaming={isStreaming} />

        <div className="flex gap-3">
          <button onClick={handleReview} disabled={isStreaming || completed.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
            {isStreaming ? '🔍 AI 正在评审...' : '🔍 开始质量评审'}
          </button>
          <button onClick={() => router.push(`/project/${projectId}/export`)}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">
            📦 导出剧本
          </button>
        </div>
      </div>
    </StepLayout>
  )
}
