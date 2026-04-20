'use client'
import { useEffect, useRef } from 'react'

interface Props {
  content: string
  isStreaming: boolean
}

export default function StreamingText({ content, isStreaming }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [content])

  if (!content && !isStreaming) return null
  return (
    <div ref={ref} className="mt-4 p-4 bg-gray-50 rounded-lg border max-h-96 overflow-y-auto">
      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
        {content}
        {isStreaming && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />}
      </pre>
    </div>
  )
}
