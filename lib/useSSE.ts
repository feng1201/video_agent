export async function streamFromAPI(
  url: string,
  body: object,
  onChunk: (content: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue
        try {
          const json = JSON.parse(line.slice(6))
          if (json.type === 'chunk') onChunk(json.content)
          if (json.type === 'done') onDone()
          if (json.type === 'error') onError(json.message)
        } catch {}
      }
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return
    onError('网络错误，请重试')
  }
}
