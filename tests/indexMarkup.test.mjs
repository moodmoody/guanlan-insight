import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('home quick actions use stable view tiles instead of native buttons', () => {
  const markup = readFileSync(new URL('../miniprogram/pages/index/index.wxml', import.meta.url), 'utf8')

  assert.equal(markup.includes('<button class="secondary-button"'), false)
  assert.equal(markup.includes('<button class="primary-button"'), false)
  assert.equal((markup.match(/class="secondary-button action-tile"/g) || []).length, 3)
})
