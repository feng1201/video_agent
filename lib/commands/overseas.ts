import { updateState } from '@/lib/state'
import { StreamCallbacks } from '@/lib/llm'

export async function runOverseas(
  projectId: string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  await updateState(projectId, { mode: 'overseas', language: 'en' })
  callbacks.onChunk(`🌏 已切换为出海模式\n\n- 输出语言：English\n- 剧本格式：Hollywood Standard\n- 文化背景：Western/International\n- 参考平台：ReelShort / DramaBox\n\n继续当前创作流程，所有后续输出将使用英文格式。`)
  callbacks.onFileSaved('.drama-state.json')
  callbacks.onDone()
}
