import { loadReferences } from '@/lib/references'
import { readState, updateState, writeProjectFile } from '@/lib/state'
import { streamCompletion, StreamCallbacks } from '@/lib/llm'

export async function runPlan(
  projectId: string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  const state = await readState(projectId)
  const refs = await loadReferences('plan')

  const systemPrompt = `你是专业微短剧编剧。

## 参考资料
${refs}

请生成完整的故事骨架，包含：
1. 剧名备选（3个，每个附说明）
2. 时空背景
3. 一句话故事线 + 核心冲突
4. 三幕结构拆解（第一幕/第二幕/第三幕，各含集数范围、核心事件）
5. 全剧节奏波形图（文字描述，标注高潮点、低谷点、付费卡点）
6. 付费卡点规划（具体集数 + 卡点类型 + 悬念设计）
7. 爽点矩阵（按satisfaction-matrix.md规划全剧爽点分布）
8. 结局设计（主线+感情线+伏笔回收）

输出为 creative-plan.md 格式。`

  const userPrompt = `创作方向：题材=${state.genre.join('、')}，受众=${state.audience}，基调=${state.tone}，结局=${state.ending}，集数=${state.totalEpisodes}集。请生成完整创作方案。`

  let full = ''
  await streamCompletion(systemPrompt, userPrompt, {
    onChunk: (c) => { full += c; callbacks.onChunk(c) },
    onDone: async () => {
      await writeProjectFile(projectId, 'creative-plan.md', full)
      const s = await readState(projectId)
      await updateState(projectId, {
        currentStep: 'characters',
        completedSteps: s.completedSteps.includes('plan') ? s.completedSteps : [...s.completedSteps, 'plan'],
      })
      callbacks.onFileSaved('creative-plan.md')
      callbacks.onDone()
    },
    onError: callbacks.onError,
  })
}
