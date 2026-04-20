import { checkPaywall } from '@/lib/paywall'

test('checkPaywall returns true for episode 1', async () => {
  expect(await checkPaywall('any-project', 1)).toBe(true)
})

test('checkPaywall returns true for episode 5', async () => {
  expect(await checkPaywall('any-project', 5)).toBe(true)
})

test('checkPaywall returns true for episode 100 (always free in MVP)', async () => {
  expect(await checkPaywall('any-project', 100)).toBe(true)
})
