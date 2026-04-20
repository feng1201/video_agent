'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StepLayout from '@/components/StepLayout'
import GenreCard from '@/components/GenreCard'
import StreamingText from '@/components/StreamingText'

const GENRES = [
  { genre: '战神', description: '隐藏身份的强者归来，打脸虐渣' },
  { genre: '萌宝', description: '可爱小孩撮合父母，治愈暖心' },
  { genre: '甜宠', description: '霸道总裁爱上我，甜甜恋爱' },
  { genre: '重生', description: '穿越/重生后复仇，爽点密集' },
  { genre: '豪门', description: '豪门恩怨、继承权争夺' },
  { genre: '婚姻', description: '先婚后爱、闪婚契约' },
  { genre: '复仇', description: '蛰伏多年后的精准复仇' },
  { genre: '玄幻', description: '修炼升级、异能觉醒' },
  { genre: '职场', description: '职场逆袭、商战风云' },
  { genre: '古装', description: '古代宅斗、宫廷争斗' },
  { genre: '都市', description: '都市日常、平凡人逆袭' },
  { genre: '家庭', description: '家庭情感、亲情羁绊' },
  { genre: '悬疑', description: '推理解谜、反转迭起' },
]

export default function StartPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const router = useRouter()
  const [state, setState] = useState<{ completedSteps: string[] } | null>(null)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [customDesc, setCustomDesc] = useState('')
  const [audience, setAudience] = useState('女频')
  const [tone, setTone] = useState('甜虐')
  const [ending, setEnding] = useState('大团圆')
  const [totalEpisodes, setTotalEpisodes] = useState(60)
  const [language, setLanguage] = useState('zh-CN')
  const [streaming, setStreaming] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/project/${projectId}/state`).then(r => r.json()).then(s => {
      setState(s)
      if (s.completedSteps?.includes('start')) setDone(true)
    })
  }, [projectId])

  function toggleGenre(g: string) {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  async function handleGenerate() {
    if (selectedGenres.length === 0 && !customDesc.trim()) {
      alert('请至少选择一个题材或填写故事描述')
      return
    }
    setIsStreaming(true)
    setStreaming('')
    setDone(false)
    try {
      const res = await fetch(`/api/project/${projectId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: selectedGenres.length > 0 ? selectedGenres : ['都市'], customDescription: customDesc, audience, tone, ending, totalEpisodes, language }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done: d, value } = await reader.read()
        if (d) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'chunk') setStreaming(prev => prev + json.content)
            if (json.type === 'done') { setIsStreaming(false); setDone(true) }
            if (json.type === 'error') { setIsStreaming(false); alert(json.message) }
          } catch {}
        }
      }
    } catch {
      setIsStreaming(false)
      alert('网络错误，请重试')
    }
  }

  return (
    <StepLayout
      projectId={projectId}
      currentStep="start"
      completedSteps={state?.completedSteps ?? []}
      title="第一步：选择你的故事方向"
      description="选择题材、受众和基调，AI 将根据你的选择生成专属创作方向。可以选多个题材叠加，也可以用文字描述你的想法。"
    >
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">选择题材（可多选）</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GENRES.map(g => (
              <GenreCard key={g.genre} genre={g.genre} description={g.description}
                selected={selectedGenres.includes(g.genre)} onClick={() => toggleGenre(g.genre)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">或者，描述你的故事想法</label>
          <textarea
            value={customDesc}
            onChange={e => setCustomDesc(e.target.value)}
            placeholder="例如：我想写一个阿姨反诈的故事，主角是60岁的家庭主妇..."
            className="w-full border rounded-lg p-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '目标受众', value: audience, onChange: setAudience, options: ['女频', '男频', '全年龄'] },
            { label: '故事基调', value: tone, onChange: setTone, options: ['爽燃', '甜虐', '搞笑', '暗黑', '温情'] },
            { label: '结局类型', value: ending, onChange: setEnding, options: ['大团圆', '开放式', '反转式', '悲剧'] },
          ].map(({ label, value, onChange, options }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm">
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">集数规模</label>
            <select value={totalEpisodes} onChange={e => setTotalEpisodes(Number(e.target.value))}
              className="w-full border rounded-lg p-2 text-sm">
              <option value={55}>50-60集（紧凑）</option>
              <option value={70}>60-80集（标准）</option>
              <option value={90}>80-100集（长线）</option>
            </select>
          </div>
        </div>

        <StreamingText content={streaming} isStreaming={isStreaming} />

        {done ? (
          <button onClick={() => router.push(`/project/${projectId}/plan`)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg">
            ✅ 方向已确定 → 开始制定故事方案
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={isStreaming}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50">
            {isStreaming ? '🤖 AI 正在分析...' : '🎬 生成创作方向'}
          </button>
        )}
      </div>
    </StepLayout>
  )
}
