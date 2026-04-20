import { loadReferences, COMMAND_REFERENCES } from '@/lib/references'
import path from 'path'

test('COMMAND_REFERENCES maps start to genre-guide.md', () => {
  expect(COMMAND_REFERENCES['start']).toContain('genre-guide.md')
})

test('COMMAND_REFERENCES maps episode to 4 files', () => {
  expect(COMMAND_REFERENCES['episode']).toHaveLength(4)
})

test('COMMAND_REFERENCES maps export to empty array', () => {
  expect(COMMAND_REFERENCES['export']).toHaveLength(0)
})

test('loadReferences returns content for start command', async () => {
  const result = await loadReferences('start', path.join(process.cwd(), 'references'))
  expect(result.length).toBeGreaterThan(0)
})

test('loadReferences returns empty string for export command', async () => {
  const result = await loadReferences('export', path.join(process.cwd(), 'references'))
  expect(result).toBe('')
})
