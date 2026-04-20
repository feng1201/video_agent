'use client'
import ProgressBar from './ProgressBar'
import { useRouter } from 'next/navigation'

interface Props {
  projectId: string
  currentStep: string
  completedSteps: string[]
  title: string
  description: string
  children: React.ReactNode
  prevStep?: string
  isLoading?: boolean
}

export default function StepLayout({
  projectId, currentStep, completedSteps, title, description, children, prevStep, isLoading
}: Props) {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <span className="font-bold text-gray-800">Short Drama Studio</span>
          <span className="ml-auto text-xs text-gray-400">项目 {projectId}</span>
        </div>
      </header>
      <ProgressBar currentStep={currentStep} completedSteps={completedSteps} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        {children}
        {prevStep && (
          <button
            onClick={() => router.push(`/project/${projectId}/${prevStep}`)}
            className="mt-4 text-sm text-gray-500 underline"
            disabled={isLoading}
          >
            ← 返回上一步
          </button>
        )}
      </main>
    </div>
  )
}
