import { loadReferences } from '@/lib/references'
import { readState, updateState, writeProjectFile, readProjectFile } from '@/lib/state'
import { streamCompletion, StreamCallbacks } from '@/lib/llm'

export async function runOutline(
  projectId: string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  const state = await readState(projectId)
  const refs = await loadReferences('outline')
  const plan = await readProjectFile(projectId, 'creative-plan.md').catch(() => '')
  const characters = await readProjectFile(projectId, 'characters.md').catch(() => '')

  const systemPrompt = `你是专业微短剧编剧。

## 参考资料
${refs}

请为每一集生成一行条目，格式：
第{N}集：{集标题} —— {核心冲突或爽点一句话描述} {标记}

标记说明：
- 🔥 关键剧情集（重大转折、高潮、揭秘）
- 💰 付费卡点集
- 无标记 = 常规推进集

要求：
- 覆盖全部集数
- 前10集至少3个🔥和2个💰
- 全剧🔥占25-35%，💰占10-15%
- 体现三幕结构节奏变化`

  const userPrompt = `创作方案：\n${plan.slice(0, 3000)}\n\n角色档案：\n${characters.slice(0, 2000)}\n\n总集数：${state.totalEpisodes}集\n请生成完整分集目录。`

  let full = ''
  await streamCompletion(systemPrompt, userPrompt, {
    onChunk: (c) => { full += c; callbacks.onChunk(c) },
    onDone: async () => {
      await writeProjectFile(projectId, 'episode-directory.md', full)
      const s = await readState(projectId)
      await updateState(projectId, {
        currentStep: 'episode',
        completedSteps: [...new Set([...s.completedSteps, 'outline'])],
      })
      callbacks.onFileSaved('episode-directory.md')
      callbacks.onDone()
    },
    onError: callbacks.onError,
  })
}
