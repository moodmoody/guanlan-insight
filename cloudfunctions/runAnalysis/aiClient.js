const https = require('https')
const { REPORT_SECTIONS, getAnalysisLabel, inferAnalysisType } = require('./reportTemplate')

const DEFAULT_BASE_URL = 'https://api.openai.com/v1/chat/completions'

function shouldUseAi(env) {
  return Boolean(env && env.AI_API_KEY && env.AI_MODEL)
}

function buildChatCompletionPayload(options) {
  return {
    model: options.model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          '你是观澜智析的舆情分析智能体。',
          '你需要基于用户输入和可推断的公开信息分析框架，输出审慎、可解释、不过度断言的中文报告。',
          '只返回 JSON，不要使用 Markdown，不要输出代码块。',
          'JSON 字段必须包含：summary, credibility, timeline, opinionGroups, sentimentTrend, controversyPoints, prediction, suggestions。',
          'credibility 必须包含 level, score, basis。level 使用“高”“中”“低”“待验证”之一，score 为 0-100 数字。',
          'timeline, opinionGroups, controversyPoints, suggestions 都必须是字符串数组。'
        ].join('')
      },
      {
        role: 'user',
        content: [
          `分析需求：${options.query}`,
          `分析类型：${options.analysisType || inferAnalysisType(options.query)}`,
          `时间范围：${options.timeRange || '近 7 天'}`,
          '请生成适合微信小程序展示的结构化舆情报告，重点包含信息可信度评估、不同观点阵营、趋势预测和行动建议。',
          '如果无法确认事实，请明确标注“待验证”，不要把热度当作事实。'
        ].join('\n')
      }
    ]
  }
}

async function createAiReport(options) {
  const env = options.env || process.env
  const baseUrl = env.AI_BASE_URL || DEFAULT_BASE_URL
  const payload = buildChatCompletionPayload({
    query: options.query,
    analysisType: options.analysisType,
    timeRange: options.timeRange,
    model: env.AI_MODEL
  })
  const response = await postJson(baseUrl, payload, env.AI_API_KEY)
  const text = response && response.choices && response.choices[0] && response.choices[0].message
    ? response.choices[0].message.content
    : ''

  return normalizeAiReport({
    query: options.query,
    analysisType: options.analysisType,
    timeRange: options.timeRange,
    sourceType: options.sourceType,
    openid: options.openid,
    taskId: options.taskId,
    aiText: text
  })
}

function normalizeAiReport(options) {
  const parsed = parseJson(options.aiText)
  const now = new Date()
  const query = String(options.query || '热点事件分析').trim() || '热点事件分析'
  const analysisType = options.analysisType || inferAnalysisType(query)
  const credibility = normalizeCredibility(parsed.credibility)
  const sections = [
    makeBodySection('summary', parsed.summary || `围绕“${query}”，当前需要从事实、观点、情绪和后续影响四个角度综合判断。`),
    {
      key: 'credibility',
      title: sectionTitle('credibility'),
      body: `当前可信度评估为“${credibility.level}”。建议结合原始来源、权威回应和多平台一致性继续核验。`,
      items: credibility.basis
    },
    makeItemsSection('timeline', parsed.timeline),
    makeItemsSection('opinionGroups', parsed.opinionGroups),
    makeBodySection('sentimentTrend', parsed.sentimentTrend || '当前情绪变化仍需结合后续信息观察。'),
    makeItemsSection('controversyPoints', parsed.controversyPoints),
    makeBodySection('prediction', parsed.prediction || '后续走势取决于权威回应、新证据和平台传播节奏。'),
    makeItemsSection('suggestions', parsed.suggestions)
  ]

  return {
    query,
    analysisType,
    analysisLabel: getAnalysisLabel(analysisType),
    status: 'done',
    sourceType: options.sourceType || 'user_input',
    timeRange: options.timeRange || '近 7 天',
    credibility,
    riskLevel: inferRiskLevel(analysisType, credibility.score),
    sections,
    taskId: options.taskId || '',
    openid: options.openid || '',
    deleted: false,
    provider: 'ai',
    createdAt: now,
    updatedAt: now
  }
}

function parseJson(text) {
  const raw = String(text || '').trim()
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  if (!cleaned) {
    return {}
  }

  try {
    return JSON.parse(cleaned)
  } catch (error) {
    return {}
  }
}

function normalizeCredibility(input) {
  const level = ['高', '中', '低', '待验证'].includes(input && input.level) ? input.level : '待验证'
  const rawScore = Number(input && input.score)
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 60
  const basis = toArray(input && input.basis, [
    '当前信息仍需结合原始来源和权威渠道继续核验',
    '建议区分事实、观点与情绪表达'
  ])
  return { level, score, basis }
}

function makeBodySection(key, body) {
  return {
    key,
    title: sectionTitle(key),
    body: String(body || '')
  }
}

function makeItemsSection(key, items) {
  return {
    key,
    title: sectionTitle(key),
    items: toArray(items, ['暂无足够信息，需要补充材料继续分析'])
  }
}

function sectionTitle(key) {
  const section = REPORT_SECTIONS.find((item) => item.key === key)
  return section ? section.title : key
}

function toArray(value, fallback) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return fallback
}

function inferRiskLevel(analysisType, credibilityScore) {
  if (analysisType === 'risk') {
    return credibilityScore >= 70 ? '中' : '高'
  }
  if (analysisType === 'credibility' && credibilityScore < 50) {
    return '中'
  }
  return '低'
}

function postJson(url, payload, apiKey) {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const body = JSON.stringify(payload)
    const request = https.request({
      method: 'POST',
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      port: target.port || 443,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 45000
    }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`AI request failed: ${response.statusCode} ${text.slice(0, 200)}`))
          return
        }
        try {
          resolve(JSON.parse(text))
        } catch (error) {
          reject(new Error('AI response is not valid JSON'))
        }
      })
    })

    request.on('timeout', () => {
      request.destroy(new Error('AI request timeout'))
    })
    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

module.exports = {
  buildChatCompletionPayload,
  createAiReport,
  normalizeAiReport,
  shouldUseAi
}
