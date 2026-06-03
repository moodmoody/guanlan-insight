import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  inferAnalysisType,
  buildMockReport,
  buildReportDocument,
  REPORT_SECTIONS
} = require('../miniprogram/utils/reportTemplate.js')

test('infers credibility analysis for fact-checking queries', () => {
  assert.equal(inferAnalysisType('这条网传消息可信吗？帮我甄别一下'), 'credibility')
})

test('infers trend analysis for future-facing queries', () => {
  assert.equal(inferAnalysisType('这个话题未来 7 天是否可能继续发酵'), 'trend')
})

test('builds report with all V1 sections and user query', () => {
  const report = buildMockReport('分析某品牌近期负面舆情')

  assert.equal(report.query, '分析某品牌近期负面舆情')
  assert.deepEqual(report.sections.map((section) => section.key), REPORT_SECTIONS.map((section) => section.key))
  assert.equal(report.credibility.level, '待验证')
  assert.ok(report.createdAt)
})

test('builds database-ready report document with owner and task fields', () => {
  const report = buildReportDocument({
    query: '这条消息可信吗？',
    taskId: 'task_123',
    openid: 'openid_abc',
    timeRange: '近 24 小时'
  })

  assert.equal(report.taskId, 'task_123')
  assert.equal(report.openid, 'openid_abc')
  assert.equal(report.timeRange, '近 24 小时')
  assert.equal(report.analysisType, 'credibility')
  assert.equal(report.deleted, false)
})
