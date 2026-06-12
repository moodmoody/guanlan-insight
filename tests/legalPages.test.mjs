import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('legal pages are registered and reachable from profile', () => {
  const appConfig = JSON.parse(readFileSync(new URL('../miniprogram/app.json', import.meta.url), 'utf8'))
  const profileMarkup = readFileSync(new URL('../miniprogram/pages/profile/profile.wxml', import.meta.url), 'utf8')
  const profileScript = readFileSync(new URL('../miniprogram/pages/profile/profile.js', import.meta.url), 'utf8')

  assert.ok(appConfig.pages.includes('pages/legal/user-agreement/user-agreement'))
  assert.ok(appConfig.pages.includes('pages/legal/privacy-policy/privacy-policy'))
  assert.ok(appConfig.pages.includes('pages/legal/ai-disclaimer/ai-disclaimer'))
  assert.match(profileMarkup, /用户协议/)
  assert.match(profileMarkup, /隐私政策/)
  assert.match(profileMarkup, /AI 内容说明/)
  assert.match(profileScript, /openLegal/)
})
