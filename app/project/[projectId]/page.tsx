import { redirect } from 'next/navigation'
import { readState, projectExists } from '@/lib/state'

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  if (!(await projectExists(projectId))) {
    redirect('/?error=not-found')
  }
  const state = await readState(projectId)
  redirect(`/project/${projectId}/${state.currentStep}`)
}
