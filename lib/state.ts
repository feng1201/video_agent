import fs from 'fs/promises'
import path from 'path'

export type Step = 'start' | 'plan' | 'characters' | 'outline' | 'episode' | 'review' | 'export'
export type Mode = 'domestic' | 'overseas'

export interface DramaState {
  projectId: string
  currentStep: Step
  completedSteps: string[]
  genre: string[]
  audience: string
  tone: string
  ending: string
  totalEpisodes: number
  completedEpisodes: number[]
  language: string
  mode: Mode
  dramaTitle: string
  createdAt: string
}

function projectDir(projectId: string): string {
  const base = process.env.DATA_DIR ?? path.join(process.cwd(), 'data', 'projects')
  return path.join(base, projectId)
}

function stateFile(projectId: string): string {
  return path.join(projectDir(projectId), '.drama-state.json')
}

export async function projectExists(projectId: string): Promise<boolean> {
  try {
    await fs.access(stateFile(projectId))
    return true
  } catch {
    return false
  }
}

export async function writeState(projectId: string, state: DramaState): Promise<void> {
  await fs.mkdir(projectDir(projectId), { recursive: true })
  await fs.writeFile(stateFile(projectId), JSON.stringify(state, null, 2), 'utf-8')
}

export async function readState(projectId: string): Promise<DramaState> {
  const raw = await fs.readFile(stateFile(projectId), 'utf-8')
  return JSON.parse(raw) as DramaState
}

export async function updateState(projectId: string, patch: Partial<DramaState>): Promise<DramaState> {
  const current = await readState(projectId)
  const updated = { ...current, ...patch }
  await writeState(projectId, updated)
  return updated
}

export async function writeProjectFile(projectId: string, filename: string, content: string): Promise<void> {
  const fullPath = path.join(projectDir(projectId), filename)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, content, 'utf-8')
}

export async function readProjectFile(projectId: string, filename: string): Promise<string> {
  return fs.readFile(path.join(projectDir(projectId), filename), 'utf-8')
}

export async function listEpisodes(projectId: string): Promise<number[]> {
  try {
    const episodeDir = path.join(projectDir(projectId), 'episodes')
    const files = await fs.readdir(episodeDir)
    return files
      .filter(f => /^ep\d{3}\.md$/.test(f))
      .map(f => parseInt(f.slice(2, 5), 10))
      .sort((a, b) => a - b)
  } catch {
    return []
  }
}
