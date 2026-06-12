import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('progress page communicates backend AI processing instead of showing 100 percent', () => {
  const script = readFileSync(new URL('../miniprogram/pages/progress/progress.js', import.meta.url), 'utf8')
  const markup = readFileSync(new URL('../miniprogram/pages/progress/progress.wxml', import.meta.url), 'utf8')

  assert.equal(script.includes('Math.min(100'), false)
  assert.equal(script.includes('processing'), true)
  assert.equal(script.includes('AI 正在后台处理'), true)
  assert.equal(markup.includes('{{statusLabel}}'), true)
  assert.equal(markup.includes('报告正在生成'), true)
})
