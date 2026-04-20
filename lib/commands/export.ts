import { readState, readProjectFile, writeProjectFile, listEpisodes } from '@/lib/state'
import { StreamCallbacks } from '@/lib/llm'

export async function runExport(
  projectId: string,
  callbacks: StreamCallbacks & { onFileSaved: (f: string) => void }
): Promise<void> {
  const state = await readState(projectId)
  const plan = await readProjectFile(projectId, 'creative-plan.md').catch(() => '')
  const characters = await readProjectFile(projectId, 'characters.md').catch(() => '')
  const directory = await readProjectFile(projectId, 'episode-directory.md').catch(() => '')
  const completedEps = await listEpisodes(projectId)

  let episodesContent = ''
  for (const ep of completedEps) {
    const content = await readProjectFile(projectId, `episodes/ep${String(ep).padStart(3, '0')}.md`).catch(() => '')
    if (content) episodesContent += content + '\n\n---\n\n'
  }

  const title = state.dramaTitle || '未命名短剧'
  const today = new Date().toISOString().split('T')[0]

  const fullScript = `# ${title}

## 元信息

| 项目 | 内容 |
|------|------|
| 类型 | ${state.genre.join('+')} |
| 集数 | ${completedEps.length}/${state.totalEpisodes} |
| 单集时长 | 约1-3分钟 |
| 目标受众 | ${state.audience} |
| 故事基调 | ${state.tone} |
| 创作日期 | ${today} |

## 故事梗概

${plan.split('\n').slice(0, 20).join('\n')}

## 主要角色

${characters.split('\n').slice(0, 30).join('\n')}

## 分集目录

${directory}

## 分集剧本

${episodesContent}`

  const filename = `export/${title}-完整剧本.md`
  await writeProjectFile(projectId, filename, fullScript)

  callbacks.onChunk(`✅ 剧本已导出！\n\n📁 文件：${filename}\n📊 已完成：${completedEps.length}/${state.totalEpisodes}集\n📝 总字数：约${fullScript.length}字\n\n💡 提示：可将 .md 转为 .docx 格式提交审核`)
  callbacks.onFileSaved(filename)
  callbacks.onDone()
}
