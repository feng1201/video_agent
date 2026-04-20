import { loadReferences } from '@/lib/references'
import { readState, updateState, writeProjectFile, readProjectFile } from '@/lib/state'
import { streamCompletion, StreamCallbacks } from '@/lib/llm'

export async function runCharacters(
  projectId: string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  const state = await readState(projectId)
  const refs = await loadReferences('characters')
  const plan = await readProjectFile(projectId, 'creative-plan.md').catch(() => '')

  const systemPrompt = `你是专业微短剧编剧。

## 参考资料
${refs}

请生成完整角色体系，包含：
1. 主要角色档案（每个角色：姓名/年龄/外貌/性格关键词/公开身份vs真实身份/核心动机/最大冲突点/爽点功能/口头禅）
2. 角色关系图（严格使用Mermaid graph TD格式）
3. 角色弧线设计（每个主要角色从第1集到最后一集的变化轨迹）
4. 感情线弧线（男女主关系发展关键节点，标注集数）
5. 关键互动场景预设（第一次冲突/身份揭露/感情转折/终极对决）
6. 反派体系（4层：小反派/中反派/大反派/隐藏反派）`

  const userPrompt = `创作方案：\n${plan}\n\n题材：${state.genre.join('、')}，受众：${state.audience}\n请生成完整角色体系。`

  let full = ''
  await streamCompletion(systemPrompt, userPrompt, {
    onChunk: (c) => { full += c; callbacks.onChunk(c) },
    onDone: async () => {
      await writeProjectFile(projectId, 'characters.md', full)
      const s = await readState(projectId)
      await updateState(projectId, {
        currentStep: 'outline',
        completedSteps: s.completedSteps.includes('characters') ? s.completedSteps : [...s.completedSteps, 'characters'],
      })
      callbacks.onFileSaved('characters.md')
      callbacks.onDone()
    },
    onError: callbacks.onError,
  })
}
