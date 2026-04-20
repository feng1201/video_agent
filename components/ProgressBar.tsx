'use client'

const STEPS = [
  { key: 'start', label: '选题' },
  { key: 'plan', label: '方案' },
  { key: 'characters', label: '角色' },
  { key: 'outline', label: '目录' },
  { key: 'episode', label: '剧本' },
  { key: 'review', label: '评审' },
  { key: 'export', label: '导出' },
]

interface Props {
  currentStep: string
  completedSteps: string[]
}

export default function ProgressBar({ currentStep, completedSteps }: Props) {
  return (
    <div className="flex items-center gap-1 py-3 px-4 bg-white border-b overflow-x-auto">
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(step.key)
        const isCurrent = step.key === currentStep
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex flex-col items-center min-w-[48px] ${
              isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                isCompleted ? 'bg-green-600 border-green-600 text-white' :
                isCurrent ? 'bg-blue-600 border-blue-600 text-white' :
                'bg-white border-gray-300'
              }`}>
                {isCompleted ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-0.5">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 mx-0.5 mb-3 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
