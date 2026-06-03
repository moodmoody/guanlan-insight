import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  buildChatCompletionPayload,
  normalizeAiReport,
  shouldUseAi
} = require('../cloudfunctions/runAnalysis/aiClient.js')

test('requires api key and model before using real AI', () => {
  assert.equal(shouldUseAi({ AI_API_KEY: 'sk-test', AI_MODEL: 'deepseek-chat' }), true)
  assert.equal(shouldUseAi({ AI_API_KEY: 'sk-test' }), false)
  assert.equal(shouldUseAi({ AI_MODEL: 'deepseek-chat' }), false)
})

test('builds chat completion payload with strict report JSON instruction', () => {
  const payload = buildChatCompletionPayload({
    query: '这条消息可信吗？',
    analysisType: 'credibility',
    timeRange: '近 7 天',
    model: 'deepseek-chat'
  })

  assert.equal(payload.model, 'deepseek-chat')
  assert.equal(payload.messages.length, 2)
  assert.match(payload.messages[0].content, /只返回 JSON/)
  assert.match(payload.messages[1].content, /这条消息可信吗/)
})

test('normalizes ai json into the V1 report structure', () => {
  const report = normalizeAiReport({
    query: '某品牌争议',
    analysisType: 'risk',
    timeRange: '近 7 天',
    openid: 'openid_1',
    taskId: 'task_1',
    aiText: JSON.stringify({
      summary: '事件正在扩散。',
      credibility: {
        level: '中',
        score: 72,
        basis: ['存在多源交叉信息', '仍缺少一手材料']
      },
      timeline: ['出现原始爆料', '平台开始讨论'],
      opinionGroups: ['质疑方', '观望方'],
      sentimentTrend: '情绪偏负面。',
      controversyPoints: ['事实细节', '回应速度'],
      prediction: '短期仍会发酵。',
      suggestions: ['发布澄清', '持续监测']
    })
  })

  assert.equal(report.query, '某品牌争议')
  assert.equal(report.openid, 'openid_1')
  assert.equal(report.taskId, 'task_1')
  assert.equal(report.credibility.level, '中')
  assert.equal(report.credibility.score, 72)
  assert.equal(report.sections.length, 8)
  assert.equal(report.sections[0].key, 'summary')
  assert.equal(report.sections[7].key, 'suggestions')
})
