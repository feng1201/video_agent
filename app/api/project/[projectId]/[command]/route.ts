import { SSE_HEADERS, sseChunk, sseDone, sseError } from '@/lib/sse'
import { projectExists } from '@/lib/state'
import { runStart } from '@/lib/commands/start'
import { runPlan } from '@/lib/commands/plan'
import { runCharacters } from '@/lib/commands/characters'
import { runOutline } from '@/lib/commands/outline'
import { runEpisode } from '@/lib/commands/episode'
import { runReview } from '@/lib/commands/review'
import { runExport } from '@/lib/commands/export'
import { runOverseas } from '@/lib/commands/overseas'
import { runCompliance } from '@/lib/commands/compliance'

export async function POST(
  request: Request,
  { params }: { params: { projectId: string; command: string } }
): Promise<Response> {
  const { projectId, command } = params

  if (!(await projectExists(projectId))) {
    return new Response(sseError('项目未找到') as BodyInit, { headers: SSE_HEADERS })
  }

  const body = await request.json().catch(() => ({}))

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const callbacks = {
        onChunk: (content: string) => controller.enqueue(sseChunk(content)),
        onDone: () => { controller.enqueue(sseDone()); controller.close() },
        onError: (message: string) => { controller.enqueue(sseError(message)); controller.close() },
        onFileSaved: (filename: string) => controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: 'saved', fileSaved: filename })}\n\n`)
        ),
      }

      try {
        switch (command) {
          case 'start': await runStart(projectId, body, callbacks); break
          case 'plan': await runPlan(projectId, callbacks); break
          case 'characters': await runCharacters(projectId, callbacks); break
          case 'outline': await runOutline(projectId, callbacks); break
          case 'episode': await runEpisode(projectId, body.episode ?? 1, callbacks); break
          case 'review': await runReview(projectId, body.episode ?? 1, callbacks); break
          case 'export': await runExport(projectId, callbacks); break
          case 'overseas': await runOverseas(projectId, callbacks); break
          case 'compliance': await runCompliance(projectId, callbacks); break
          default:
            controller.enqueue(sseError(`未知命令: ${command}`))
            controller.close()
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '服务器错误'
        controller.enqueue(sseError(msg))
        controller.close()
      }
    },
  })

  return new Response(stream as BodyInit, { headers: SSE_HEADERS })
}
