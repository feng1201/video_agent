'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [resumeId, setResumeId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    setLoading(true)
    try {
      const res = await fetch('/api/project/new', { method: 'POST' })
      const { projectId } = await res.json()
      router.push(`/project/${projectId}/start`)
    } catch {
      setError('创建失败，请刷新重试')
      setLoading(false)
    }
  }

  async function handleResume() {
    if (!resumeId.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/project/${resumeId.trim()}/state`)
      if (!res.ok) {
        setError('项目未找到，请检查ID是否正确')
        setLoading(false)
        return
      }
      const state = await res.json()
      router.push(`/project/${resumeId.trim()}/${state.currentStep}`)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          <span className="text-xl font-bold text-gray-800">Short Drama Studio</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          每个人都是<span className="text-blue-600">想象力的导演</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          用 AI 帮你写出爆款短剧剧本。无需任何创作经验，30分钟完成一部完整故事。
        </p>

        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {[
            { icon: '⚡', title: '30分钟', sub: '完成完整剧本' },
            { icon: '📽️', title: '专业格式', sub: '导演可直接使用' },
            { icon: '📥', title: '随时下载', sub: '.md 格式文件' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-bold text-gray-800">{f.title}</div>
              <div className="text-sm text-gray-500">{f.sub}</div>
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? '正在创建...' : '🚀 立即开始创作'}
        </button>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-gray-500">已有项目？输入ID继续创作</p>
          <div className="flex gap-2">
            <input
              value={resumeId}
              onChange={e => { setResumeId(e.target.value); setError('') }}
              placeholder="输入项目ID（如 xk3m9p2q）"
              className="border rounded-lg px-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onKeyDown={e => e.key === 'Enter' && handleResume()}
            />
            <button
              onClick={handleResume}
              disabled={loading || !resumeId.trim()}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40"
            >
              恢复
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-10">3步完成一部短剧</h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { icon: '🎯', title: '选题定向', desc: '选择题材、受众、基调，AI 理解你的创作方向' },
              { icon: '✍️', title: '逐步创作', desc: '按向导完成角色、大纲、每集剧本，全程 AI 辅助' },
              { icon: '📦', title: '导出下载', desc: '质量评审后一键导出完整剧本，立即可用' },
            ].map(s => (
              <div key={s.title} className="flex flex-col items-center">
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="font-bold text-gray-800 mb-1">{s.title}</div>
                <div className="text-sm text-gray-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400">
        Powered by DeepSeek · Short Drama Studio
      </footer>
    </div>
  )
}
