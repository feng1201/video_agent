import { readProjectFile } from '@/lib/state'
import { streamCompletion, StreamCallbacks } from '@/lib/llm'
import { parseEpisodeRange } from './episode'

export async function runReview(
  projectId: string,
  episode: number | string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  const episodes = parseEpisodeRange(episode)

  for (const ep of episodes) {
    const filename = `episodes/ep${String(ep).padStart(3, '0')}.md`
    const content = await readProjectFile(projectId, filename).catch(() => '')
    if (!content) {
      callbacks.onError(`第${ep}集尚未生成`)
      return
    }

    const systemPrompt = `你是专业微短剧质量审核专家。请对剧本进行质量自检，按以下格式输出：

# 🔍 质量自检报告 - 第${ep}集

## 评分

| 维度 | 得分 | 说明 |
|------|------|------|
| 节奏 | {X}/10 | {具体说明} |
| 爽点 | {X}/10 | {具体说明} |
| 台词 | {X}/10 | {具体说明} |
| 格式 | {X}/10 | {具体说明} |
| 连贯性 | {X}/10 | {具体说明} |
| **总分** | **{X}/50** | |

## 问题清单

{按严重程度列出问题}

## 修改建议

{按优先级排列的具体修改方案}`

    const userPrompt = `请检查以下第${ep}集剧本：\n\n${content}`

    await new Promise<void>((resolve) => {
      streamCompletion(systemPrompt, userPrompt, {
        onChunk: callbacks.onChunk,
        onDone: () => { resolve() },
        onError: (msg) => { callbacks.onError(msg); resolve() },
      })
    })
  }
  callbacks.onDone()
}
