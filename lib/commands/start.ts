import { loadReferences } from '@/lib/references'
import { updateState, readState } from '@/lib/state'
import { streamCompletion, StreamCallbacks } from '@/lib/llm'

interface StartInput {
  genre: string[]
  customDescription?: string
  audience: string
  tone: string
  ending: string
  totalEpisodes: number
  language: string
}

export async function runStart(
  projectId: string,
  input: StartInput,
  callbacks: StreamCallbacks & { onFileSaved: (filename: string) => void }
): Promise<void> {
  const refs = await loadReferences('start')
  const mode = input.language === 'en' ? 'overseas' : 'domestic'

  const systemPrompt = `你是一位专业的微短剧编剧，精通短视频平台的爆款短剧创作方法论。

## 参考资料
${refs}

请根据用户选择生成创作方向确认，严格使用以下格式：

# 🎬 创作方向确认

- **题材组合：** {题材}
- **目标受众：** {受众}
- **故事基调：** {基调}
- **结局类型：** {结局}
- **集数规模：** {集数}集
- **输出模式：** ${mode === 'overseas' ? '出海' : '国内'}
- **输出语言：** ${input.language === 'en' ? 'English' : '中文'}

✅ 方向已锁定！`

  const userPrompt = `用户选择：
题材：${input.genre.join('、')}${input.customDescription ? `（补充：${input.customDescription}）` : ''}
目标受众：${input.audience}
故事基调：${input.tone}
结局类型：${input.ending}
集数规模：${input.totalEpisodes}集
请生成创作方向确认内容。`

  await streamCompletion(systemPrompt, userPrompt, {
    onChunk: callbacks.onChunk,
    onDone: async () => {
      const state = await readState(projectId)
      await updateState(projectId, {
        genre: input.genre,
        audience: input.audience,
        tone: input.tone,
        ending: input.ending,
        totalEpisodes: input.totalEpisodes,
        language: input.language,
        mode,
        currentStep: 'plan',
        completedSteps: [...new Set([...state.completedSteps, 'start'])],
      })
      callbacks.onFileSaved('.drama-state.json')
      callbacks.onDone()
    },
    onError: callbacks.onError,
  })
}
