'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'

export default function EpisodePage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[]; completedEpisodes: number[]; totalEpisodes: number } | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [streaming, setStreaming] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [currentEp, setCurrentEp] = useState<number | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const abortRef = useRef(false)
  const abortCtrlRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => setState(s))
  }, [projectId])

  const total = state?.totalEpisodes ?? 0
  const completed = state?.completedEpisodes ?? []
  const allEps = Array.from({ length: total }, (_, i) => i + 1)
  const undoneEps = allEps.filter(ep => !completed.includes(ep))

  function toggleEp(ep: number) {
    setSelected(prev =>
      prev.includes(ep) ? prev.filter(e => e !== ep) : [...prev, ep].sort((a, b) => a - b)
    )
  }

  function selectAll() { setSelected(allEps) }
  function selectUndone() { setSelected([...undoneEps]) }
  function selectN(n: number) { setSelected(undoneEps.slice(0, n)) }
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

      const ctrl = new AbortController()
      abortCtrlRef.current = ctrl

      await new Promise<void>(resolve => {
        streamFromAPI(
          `/api/project/${projectId}/episode`,
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
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => setState(s))
  }

  function handleStop() {
    abortRef.current = true
    abortCtrlRef.current?.abort()
  }

  return (
    <StepLayout projectId={projectId} currentStep="episode" completedSteps={state?.completedSteps ?? []}
      title="第五步：生成分集剧本" prevStep="outline"
      description="选择要生成的集数，AI 将按顺序逐集完成。每集包含场景、台词、景别和音乐提示。">
      <div className="space-y-4">

        {/* Quick select buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 font-medium">快速选择：</span>
          <button onClick={selectUndone} disabled={isRunning}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-40">
            未完成（{undoneEps.length}集）
          </button>
          <button onClick={() => selectN(10)} disabled={isRunning || undoneEps.length === 0}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-40">
            前10集
          </button>
          <button onClick={() => selectN(20)} disabled={isRunning || undoneEps.length === 0}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-40">
            前20集
          </button>
          <button onClick={selectAll} disabled={isRunning}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-40">
            全选（{total}集）
          </button>
          <button onClick={clearSel} disabled={isRunning}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 disabled:opacity-40">
            清除
          </button>
          <span className="ml-auto text-sm text-gray-500">已选 {selected.length} 集</span>
        </div>

        {/* Episode checkbox list */}
        {total > 0 && (
          <div className="border rounded-lg overflow-y-auto max-h-52 p-2 bg-gray-50">
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-1">
              {allEps.map(ep => {
                const isDone = completed.includes(ep)
                const isSel = selected.includes(ep)
                const isCurrent = currentEp === ep
                return (
                  <label key={ep}
                    className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-sm select-none
                      ${isCurrent ? 'bg-yellow-100 border border-yellow-400' :
                        isDone ? 'bg-green-50 text-green-700' : 'bg-white hover:bg-blue-50'}
                      ${isRunning ? 'cursor-default' : ''}`}>
                    <input type="checkbox" checked={isSel} disabled={isRunning}
                      onChange={() => toggleEp(ep)}
                      className="accent-blue-600" />
                    <span className={isDone ? 'line-through text-green-600' : ''}>
                      {ep}
                    </span>
                    {isDone && <span className="text-green-500 text-xs">✓</span>}
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isRunning && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>正在生成第 {currentEp} 集</span>
              <span>{progress.done} / {progress.total} 集完成</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Streaming output */}
        <StreamingText content={streaming} isStreaming={isRunning && currentEp !== null} />

        {/* Action buttons */}
        <div className="flex gap-3">
          {isRunning ? (
            <button onClick={handleStop}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-600">
              ⏹ 停止生成
            </button>
          ) : (
            <button onClick={handleRun} disabled={selected.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50">
              ✍️ 生成选中的 {selected.length} 集
            </button>
          )}
          {completed.length >= 1 && (
            <button onClick={() => router.push(`/project/${projectId}/review`)}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">
              📊 去评审剧本
            </button>
          )}
        </div>

        {completed.length > 0 && (
          <div className="text-xs text-gray-400 text-center">
            已完成 {completed.length}/{total} 集
          </div>
        )}
      </div>
    </StepLayout>
  )
}
