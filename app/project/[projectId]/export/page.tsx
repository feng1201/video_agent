'use client'
import { useState, useEffect } from 'react'
import StepLayout from '@/components/StepLayout'
import StreamingText from '@/components/StreamingText'
import { streamFromAPI } from '@/lib/useSSE'

export default function ExportPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const [state, setState] = useState<{ completedSteps: string[]; completedEpisodes: number[]; totalEpisodes: number } | null>(null)
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [exportFile, setExportFile] = useState('')

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(setState)
  }, [projectId])

  async function handleExport() {
    setIsStreaming(true)
    setStreaming('')
    try {
      const res = await fetch(`/api/project/${projectId}/export`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'chunk') setStreaming(prev => prev + json.content)
            if (json.type === 'saved' && json.fileSaved) setExportFile(json.fileSaved)
            if (json.type === 'done') setIsStreaming(false)
            if (json.type === 'error') { setIsStreaming(false); alert(json.message) }
          } catch {}
        }
      }
    } catch {
      setIsStreaming(false)
      alert('导出失败，请重试')
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/project/${projectId}/download`)
      if (!res.ok) { alert('下载失败，请先生成导出文件'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = exportFile.split('/').pop() ?? 'script.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('下载失败')
    }
  }

  return (
    <StepLayout projectId={projectId} currentStep="export" completedSteps={state?.completedSteps ?? []}
      title="第七步：导出完整剧本" prevStep="review"
      description="将所有已完成集数合并为完整的专业剧本文件，可下载为 .md 格式。">
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 text-sm">
          📊 已完成 <strong>{state?.completedEpisodes?.length ?? 0}</strong> 集 / 共 {state?.totalEpisodes ?? '—'} 集
        </div>
        <StreamingText content={streaming} isStreaming={isStreaming} />
        <div className="flex gap-3">
          <button onClick={handleExport} disabled={isStreaming || (state?.completedEpisodes?.length ?? 0) === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
            {isStreaming ? '📦 正在整合...' : '📦 生成完整剧本'}
          </button>
          {exportFile && (
            <button onClick={handleDownload}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold">
              ⬇️ 下载 .md 文件
            </button>
          )}
        </div>
        {exportFile && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="font-bold text-green-800 mb-1">🎉 恭喜完成创作！</p>
            <p className="text-sm text-gray-600">项目ID：<strong>{projectId}</strong>（请保存，用于下次恢复）</p>
          </div>
        )}
      </div>
    </StepLayout>
  )
}
