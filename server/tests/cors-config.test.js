import test from 'node:test'
import assert from 'node:assert/strict'

const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,https://steel-shaft-production.vercel.app').split(',').map((origin) => origin.trim())

test('allows the deployed frontend origin', () => {
  assert.ok(origins.includes('https://steel-shaft-production.vercel.app'))
})
