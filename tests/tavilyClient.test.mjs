import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  buildTavilyPayload,
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
    timeRange: '近 7 天'
  })

  assert.equal(payload.query, '某品牌争议')
  assert.equal(payload.topic, 'news')
  assert.equal(payload.search_depth, 'basic')
  assert.equal(payload.time_range, 'week')
  assert.equal(payload.max_results, 8)
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
        title: '',
        url: '',
        content: ''
      }
    ]
  })

  assert.equal(sources.length, 1)
  assert.equal(sources[0].title, '官方回应某事件')
  assert.equal(sources[0].url, 'https://example.com/a')
  assert.equal(sources[0].sourceType, '官方/权威来源')
})
