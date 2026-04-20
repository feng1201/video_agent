import { render, screen } from '@testing-library/react'
import ProgressBar from '@/components/ProgressBar'

test('renders all 7 step labels', () => {
  render(<ProgressBar currentStep="start" completedSteps={[]} />)
  expect(screen.getByText('选题')).toBeInTheDocument()
  expect(screen.getByText('方案')).toBeInTheDocument()
  expect(screen.getByText('导出')).toBeInTheDocument()
})

test('current step has blue styling', () => {
  render(<ProgressBar currentStep="plan" completedSteps={['start']} />)
  const planLabel = screen.getByText('方案')
  expect(planLabel.closest('div')).toHaveClass('text-blue-600')
})

test('completed step has green styling', () => {
  render(<ProgressBar currentStep="plan" completedSteps={['start']} />)
  const startLabel = screen.getByText('选题')
  expect(startLabel.closest('div')).toHaveClass('text-green-600')
})
