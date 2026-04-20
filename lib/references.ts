import fs from 'fs/promises'
import path from 'path'

export const COMMAND_REFERENCES: Record<string, string[]> = {
  start: ['genre-guide.md'],
  plan: ['opening-rules.md', 'paywall-design.md', 'rhythm-curve.md', 'satisfaction-matrix.md'],
  characters: ['villain-design.md'],
  outline: ['paywall-design.md', 'rhythm-curve.md'],
  episode: ['opening-rules.md', 'rhythm-curve.md', 'satisfaction-matrix.md', 'hook-design.md'],
  review: [],
  export: [],
  overseas: ['genre-guide.md'],
  compliance: ['compliance-checklist.md'],
}

export async function loadReferences(command: string, refDir?: string): Promise<string> {
  const dir = refDir ?? path.join(process.cwd(), 'references')
  const files = COMMAND_REFERENCES[command] ?? []
  if (files.length === 0) return ''
  const contents = await Promise.all(
    files.map(async (filename) => {
      const content = await fs.readFile(path.join(dir, filename), 'utf-8')
      return `## ${filename}\n\n${content}`
    })
  )
  return contents.join('\n\n---\n\n')
}
