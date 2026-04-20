import { loadReferences } from '@/lib/references'
import { readState, updateState, writeProjectFile, readProjectFile } from '@/lib/state'
import { streamCompletion, StreamCallbacks } from '@/lib/llm'
import { checkPaywall } from '@/lib/paywall'

export function parseEpisodeRange(episode: number | string): number[] {
  if (typeof episode === 'number') return [episode]
  const match = String(episode).match(/^(\d+)-(\d+)$/)
  if (match) {
    const start = parseInt(match[1], 10)
    const end = parseInt(match[2], 10)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  return [parseInt(String(episode), 10)]
}

export async function runEpisode(
  projectId: string,
  episode: number | string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  const episodes = parseEpisodeRange(episode)

  for (const ep of episodes) {
    const allowed = await checkPaywall(projectId, ep)
    if (!allowed) {
      callbacks.onError('需要升级会员才能生成更多集数')
      return
    }

    const refs = await loadReferences('episode')
    const directory = await readProjectFile(projectId, 'episode-directory.md').catch(() => '')
    const characters = await readProjectFile(projectId, 'characters.md').catch(() => '')
    const prevEp = ep > 1
      ? await readProjectFile(projectId, `episodes/ep${String(ep - 1).padStart(3, '0')}.md`).catch(() => '')
      : ''

    const systemPrompt = `你是专业微短剧编剧。

## 参考资料
${refs}

请按以下格式生成完整单集剧本：

# 第{N}集：{集标题}

> 本集关键词：{3个关键词}
> 本集爽点：{爽点类型}
> 前情提要：{上集结尾悬念，1-2句}

---

## 场次一

**场景：** 内景/外景 · {地点} · 日/夜
**出场人物：** {人物列表}

△ （全景）{场景描写}

**{角色名}**（{语气}）："{台词}"

♪ 音乐提示：{描述}

---

> 🎣 本集钩子：{悬念描述}
> 📺 下集预告：{1句}

质量要求：每集3-5个场次，800字以上，${ep === 1 ? '第1集前3段必须抓住观众' : '结尾必须有强悬念'}`

    const userPrompt = `分集目录：\n${directory.slice(0, 2000)}\n\n角色档案：\n${characters.slice(0, 1500)}\n${prevEp ? `\n上一集：\n${prevEp.slice(0, 1000)}\n` : ''}\n请写第${ep}集完整剧本。`

    let full = ''
    const filename = `episodes/ep${String(ep).padStart(3, '0')}.md`
    await new Promise<void>((resolve) => {
      streamCompletion(systemPrompt, userPrompt, {
        onChunk: (c) => { full += c; callbacks.onChunk(c) },
        onDone: async () => {
          await writeProjectFile(projectId, filename, full)
          const s = await readState(projectId)
          await updateState(projectId, {
            completedEpisodes: s.completedEpisodes.includes(ep) ? s.completedEpisodes : [...s.completedEpisodes, ep],
            completedSteps: s.completedSteps.includes('episode')
              ? s.completedSteps
              : [...s.completedSteps, 'episode'],
          })
          callbacks.onFileSaved(filename)
          full = ''
          resolve()
        },
        onError: (msg) => { callbacks.onError(msg); resolve() },
      })
    })
  }
  callbacks.onDone()
}
