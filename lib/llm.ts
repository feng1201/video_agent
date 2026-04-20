import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY!,
  baseURL: process.env.SILICONFLOW_BASE_URL!,
})

const MODEL = process.env.SILICONFLOW_MODEL ?? 'Pro/deepseek-ai/DeepSeek-V3.2'

export interface StreamCallbacks {
  onChunk: (content: string) => void
  onDone: () => void
  onError: (message: string) => void
}

export async function streamCompletion(
  systemPrompt: string,
  userPrompt: string,
  callbacks: StreamCallbacks,
  retries = 2
): Promise<void> {
  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      max_tokens: 8192,
    })
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) callbacks.onChunk(content)
    }
    callbacks.onDone()
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string }
    if (error.code === 'context_length_exceeded') {
      callbacks.onError('内容过长，请缩短输入后重试')
      return
    }
    if (retries > 0) {
      await streamCompletion(systemPrompt, userPrompt, callbacks, retries - 1)
    } else {
      callbacks.onError('生成失败，请点击重试')
    }
  }
}
