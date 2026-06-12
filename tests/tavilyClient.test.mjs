import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  buildExpandedQueries,
  buildTavilyPayload,
  buildSearchPlan,
  cleanSearchQuery,
  normalizeTavilyResults,
  shouldUseTavily
} = require('../cloudfunctions/runAnalysis/tavilyClient.js')

test('requires Tavily API key before searching', () => {
  assert.equal(shouldUseTavily({ TAVILY_API_KEY: 'tvly-test' }), true)
  assert.equal(shouldUseTavily({}), false)
})

test('builds Tavily news search payload for recent evidence', () => {
  const payload = buildTavilyPayload({
    query: '某品牌争议',
    timeRange: '近 7 天',
    topic: 'news'
  })

  assert.equal(payload.query, '某品牌争议')
  assert.equal(payload.topic, 'news')
  assert.equal(payload.search_depth, 'basic')
  assert.equal(payload.time_range, 'week')
  assert.equal(payload.max_results, 8)
})

test('cleans long Chinese analysis prompt into searchable keywords', () => {
  const query = cleanSearchQuery('分析一下清北鹅腿阿姨被揭发一直用鸭腿充数的事件')

  assert.equal(query, '清北鹅腿阿姨 鸭腿充数')
})

test('builds expanded Chinese query list for social topics', () => {
  const queries = buildExpandedQueries('分析一下清北鹅腿阿姨被揭发一直用鸭腿充数的事件')

  assert.deepEqual(queries.slice(0, 5), [
    '清北鹅腿阿姨 鸭腿充数',
    '清北鹅腿阿姨 鸭腿',
    '鹅腿阿姨 鸭腿',
    '清北 鹅腿阿姨 鸭腿 充数',
    '鹅腿阿姨 朝阳区市场监管局'
  ])
})

test('builds news and general search plan with expanded queries', () => {
  const plan = buildSearchPlan({
    query: '分析一下清北鹅腿阿姨被揭发一直用鸭腿充数的事件',
    timeRange: '近 7 天'
  })

  assert.equal(plan[0].topic, 'news')
  assert.equal(plan[1].topic, 'general')
  assert.equal(plan[0].query, '清北鹅腿阿姨 鸭腿充数')
  assert.equal(plan[2].query, '清北鹅腿阿姨 鸭腿')
})

test('normalizes Tavily results into compact source evidence', () => {
  const sources = normalizeTavilyResults({
    results: [
      {
        title: '官方回应某事件',
        url: 'https://example.com/a',
        content: '官方发布情况说明。',
        score: 0.91,
        published_date: '2026-06-12'
      },
      {
        title: '官方回应某事件',
        url: 'https://example.com/a',
        content: '重复结果'
      }
    ]
  })

  assert.equal(sources.length, 1)
  assert.equal(sources[0].title, '官方回应某事件')
  assert.equal(sources[0].url, 'https://example.com/a')
  assert.equal(sources[0].sourceType, '官方/权威来源')
})
