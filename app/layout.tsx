import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Short Drama Studio — 每个人都是想象力的导演',
  description: '用 AI 帮你写出爆款短剧剧本，让完全不懂创作的人也能完成一部完整短剧。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
