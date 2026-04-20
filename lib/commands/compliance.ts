import { loadReferences } from '@/lib/references'
import { readProjectFile, writeProjectFile, listEpisodes } from '@/lib/state'
import { streamCompletion, StreamCallbacks } from '@/lib/llm'

export async function runCompliance(
  projectId: string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  const refs = await loadReferences('compliance')
  const completedEps = await listEpisodes(projectId)

  let allContent = ''
  for (const ep of completedEps.slice(0, 10)) {
    const c = await readProjectFile(projectId, `episodes/ep${String(ep).padStart(3, '0')}.md`).catch(() => '')
    allContent += c + '\n\n'
  }

  const systemPrompt = `你是合规审核专家。

## 合规检查清单
${refs}

请输出：
# 📋 合规审核报告

## 审核范围
已检查集数：第1-${completedEps.length}集

## 检测结果

### 🔴 红线问题（必须修改）
### 🟡 高风险内容（建议修改）
### 🟢 合规通过项

## 修改优先级`

  const userPrompt = `请审核以下剧本内容：\n\n${allContent.slice(0, 6000)}`

  let full = ''
  await streamCompletion(systemPrompt, userPrompt, {
    onChunk: (c) => { full += c; callbacks.onChunk(c) },
    onDone: async () => {
      await writeProjectFile(projectId, 'compliance-report.md', full)
      callbacks.onFileSaved('compliance-report.md')
      callbacks.onDone()
    },
    onError: callbacks.onError,
  })
}
