const encoder = new TextEncoder()

export function sseChunk(content: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`)
}

export function sseDone(fileSaved?: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ type: 'done', fileSaved })}\n\n`)
}

export function sseError(message: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
}
