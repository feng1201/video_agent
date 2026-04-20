import { readState, writeState, updateState, projectExists, writeProjectFile, readProjectFile, listEpisodes } from '@/lib/state'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'drama-test-'))
  process.env.DATA_DIR = tmpDir
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
  delete process.env.DATA_DIR
})

const baseState = {
  projectId: 'test123',
  currentStep: 'start' as const,
  completedSteps: [] as string[],
  genre: [] as string[],
  audience: '',
  tone: '',
  ending: '',
  totalEpisodes: 0,
  completedEpisodes: [] as number[],
  language: 'zh-CN',
  mode: 'domestic' as const,
  dramaTitle: '',
  createdAt: new Date().toISOString(),
}

test('projectExists returns false for missing project', async () => {
  expect(await projectExists('nonexistent')).toBe(false)
})

test('writeState creates .drama-state.json and projectExists returns true', async () => {
  await writeState('test123', baseState)
  expect(await projectExists('test123')).toBe(true)
})

test('readState returns written state', async () => {
  const state = { ...baseState, tone: '甜虐', genre: ['战神'] }
  await writeState('test123', state)
  const result = await readState('test123')
  expect(result).toEqual(state)
})

test('updateState merges partial fields', async () => {
  await writeState('test123', baseState)
  await updateState('test123', { currentStep: 'plan', completedSteps: ['start'] })
  const result = await readState('test123')
  expect(result.currentStep).toBe('plan')
  expect(result.completedSteps).toEqual(['start'])
  expect(result.projectId).toBe('test123')
})

test('writeProjectFile and readProjectFile work', async () => {
  await writeState('test123', baseState)
  await writeProjectFile('test123', 'creative-plan.md', '# Plan content')
  const content = await readProjectFile('test123', 'creative-plan.md')
  expect(content).toBe('# Plan content')
})

test('listEpisodes returns empty array when no episodes', async () => {
  await writeState('test123', baseState)
  expect(await listEpisodes('test123')).toEqual([])
})

test('listEpisodes returns sorted episode numbers', async () => {
  await writeState('test123', baseState)
  await writeProjectFile('test123', 'episodes/ep003.md', 'ep3')
  await writeProjectFile('test123', 'episodes/ep001.md', 'ep1')
  expect(await listEpisodes('test123')).toEqual([1, 3])
})
