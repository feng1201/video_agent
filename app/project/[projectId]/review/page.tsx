'use client'
import { useState, useEffect, useRef } from 'react'
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
  const [selected, setSelected] = useState<number[]>([])
  const [streaming, setStreaming] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [currentEp, setCurrentEp] = useState<number | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [scores, setScores] = useState<{ subject: string; score: number }[]>([])
  const abortRef = useRef(false)
  const abortCtrlRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => setState(s))
  }, [projectId])

  useEffect(() => {
    if (streaming) {
      const parsed = parseScores(streaming)
      if (parsed.some(s => s.score > 0)) setScores(parsed)
    }
  }, [streaming])

  const completed = state?.completedEpisodes ?? []

  function toggleEp(ep: number) {
    setSelected(prev =>
      prev.includes(ep) ? prev.filter(e => e !== ep) : [...prev, ep].sort((a, b) => a - b)
    )
  }

  function selectAll() { setSelected([...completed]) }
  function selectN(n: number) { setSelected(completed.slice(0, n)) }
  function clearSel() { setSelected([]) }

  async function handleRun() {
    if (selected.length === 0) return
    abortRef.current = false
    setIsRunning(true)
    let doneSoFar = 0
    setProgress({ done: 0, total: selected.length })

    for (const ep of selected) {
      if (abortRef.current) break
      setCurrentEp(ep)
      setStreaming('')
      setScores([])

      const ctrl = new AbortController()
      abortCtrlRef.current = ctrl

      await new Promise<void>(resolve => {
        streamFromAPI(
          `/api/project/${projectId}/review`,
          { episode: ep },
          (c) => setStreaming(prev => prev + c),
          () => { doneSoFar++; setProgress({ done: doneSoFar, total: selected.length }); resolve() },
          () => resolve(),
          ctrl.signal
        )
      })
    }

    setIsRunning(false)
    setCurrentEp(null)
  }

  function handleStop() {
    abortRef.current = true
    abortCtrlRef.current?.abort()
  }

  return (
    <StepLayout projectId={projectId} currentStep="review" completedSteps={state?.completedSteps ?? []}
      title="第六步：质量评审" prevStep="episode"
      description="选择要评审的集数，AI 将依次进行5维度质量评分，生成问题清单和修改建议。">
      <div className="space-y-4">

        {/* Quick select buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 font-medium">快速选择：</span>
          <button onClick={selectAll} disabled={isRunning || completed.length === 0}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-40">
            全选（{completed.length}集）
          </button>
          <button onClick={() => selectN(10)} disabled={isRunning || completed.length === 0}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-40">
            前10集
          </button>
          <button onClick={() => selectN(20)} disabled={isRunning || completed.length === 0}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-40">
            前20集
          </button>
          <button onClick={clearSel} disabled={isRunning}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 disabled:opacity-40">
            清除
          </button>
          <span className="ml-auto text-sm text-gray-500">已选 {selected.length} 集</span>
        </div>

        {/* Episode checkbox list */}
        {completed.length > 0 ? (
          <div className="border rounded-lg overflow-y-auto max-h-44 p-2 bg-gray-50">
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-1">
              {completed.map(ep => {
                const isSel = selected.includes(ep)
                const isCurrent = currentEp === ep
                return (
                  <label key={ep}
                    className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm select-none
                      ${isCurrent ? 'bg-yellow-100 border border-yellow-400' : 'bg-white hover:bg-blue-50'}
                      ${isRunning ? 'cursor-default' : ''}`}>
                    <input type="checkbox" checked={isSel} disabled={isRunning}
                      onChange={() => toggleEp(ep)}
                      className="accent-blue-600" />
                    <span>第{ep}集</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50 text-center text-gray-400 text-sm">
            请先在上一步生成剧本
          </div>
        )}

        {/* Progress bar */}
        {isRunning && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>正在评审第 {currentEp} 集</span>
              <span>{progress.done} / {progress.total} 集完成</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Radar chart for current episode scores */}
        {scores.length > 0 && scores.some(s => s.score > 0) && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-1 text-center text-sm">
              第 {currentEp ?? selected[selected.length - 1]} 集 — 5维评分
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={scores} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Streaming output */}
        <StreamingText content={streaming} isStreaming={isRunning && currentEp !== null} />

        {/* Action buttons */}
        <div className="flex gap-3">
          {isRunning ? (
            <button onClick={handleStop}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-600">
              ⏹ 停止评审
            </button>
          ) : (
            <button onClick={handleRun} disabled={selected.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50">
              🔍 评审选中的 {selected.length} 集
            </button>
          )}
          <button onClick={() => router.push(`/project/${projectId}/export`)}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">
            📦 导出剧本
          </button>
        </div>
      </div>
    </StepLayout>
  )
}
