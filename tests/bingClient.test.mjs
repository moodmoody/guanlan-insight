import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  buildBingPath,
  buildSearchPlan,
  cleanSearchQuery,
  normalizeBingResults,
  shouldUseBing
} = require('../cloudfunctions/runAnalysis/bingClient.js')

test('requires Bing API key before searching', () => {
  assert.equal(shouldUseBing({ BING_SEARCH_API_KEY: 'bing-test' }), true)
  assert.equal(shouldUseBing({}), false)
})

test('builds Bing Chinese search path with market parameters', () => {
  const path = buildBingPath({
    query: '清北鹅腿阿姨 鸭腿',
    count: 8
  })

  assert.match(path, /^\/v7\.0\/search\?/)
  assert.match(path, /q=%E6%B8%85%E5%8C%97/)
  assert.match(path, /mkt=zh-CN/)
  assert.match(path, /setLang=zh-Hans/)
  assert.match(path, /count=8/)
})

test('cleans long Chinese analysis prompt into Bing search keywords', () => {
  const query = cleanSearchQuery('分析一下清北鹅腿阿姨被揭发一直用鸭腿充数的事件')

  assert.equal(query, '清北鹅腿阿姨 鸭腿充数')
})

test('builds expanded Bing search plan for Chinese social topics', () => {
  const plan = buildSearchPlan({
    query: '分析一下清北鹅腿阿姨被揭发一直用鸭腿充数的事件'
  })

  assert.deepEqual(plan.slice(0, 5), [
    '清北鹅腿阿姨 鸭腿充数',
    '清北鹅腿阿姨 鸭腿',
    '鹅腿阿姨 鸭腿',
    '清北 鹅腿阿姨 鸭腿 充数',
    '鹅腿阿姨 朝阳区市场监管局'
  ])
})

test('normalizes Bing web pages into compact source evidence', () => {
  const sources = normalizeBingResults({
    webPages: {
      value: [
        {
          name: '鹅腿阿姨回应鸭腿争议',
          url: 'https://example.com/a',
          snippet: '团购群发布公告回应。',
          datePublished: '2026-06-12T00:00:00Z'
        },
        {
          name: '鹅腿阿姨回应鸭腿争议',
          url: 'https://example.com/a',
          snippet: '重复结果'
        }
      ]
    }
  })

  assert.equal(sources.length, 1)
  assert.equal(sources[0].title, '鹅腿阿姨回应鸭腿争议')
  assert.equal(sources[0].url, 'https://example.com/a')
  assert.equal(sources[0].sourceType, '公开来源')
})
