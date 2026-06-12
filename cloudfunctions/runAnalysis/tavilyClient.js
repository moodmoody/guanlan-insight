const https = require('https')

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search'

function shouldUseTavily(env) {
  return Boolean(env && env.TAVILY_API_KEY)
}

function buildTavilyPayload(options) {
  return {
    query: String(options.query || '').trim(),
    topic: 'news',
    search_depth: 'basic',
    time_range: mapTimeRange(options.timeRange),
    max_results: 8,
    include_answer: false,
    include_raw_content: false
  }
}

async function searchSources(options) {
  const env = options.env || process.env
  const payload = buildTavilyPayload({
    query: options.query,
    timeRange: options.timeRange
  })
  const response = await postJson(TAVILY_SEARCH_URL, payload, env.TAVILY_API_KEY)
  return normalizeTavilyResults(response)
}

function normalizeTavilyResults(response) {
  const results = Array.isArray(response && response.results) ? response.results : []
  return results
    .map((item) => ({
      title: String(item.title || '').trim(),
      url: String(item.url || '').trim(),
      summary: String(item.content || item.snippet || '').trim(),
      publishedAt: item.published_date || item.publishedAt || '',
      score: typeof item.score === 'number' ? item.score : null,
      sourceType: inferSourceType(item.url || '', item.title || '')
    }))
    .filter((item) => item.title && item.url)
    .slice(0, 8)
}

function mapTimeRange(timeRange) {
  const text = String(timeRange || '')
  if (/24|1\s*天|一天/.test(text)) {
    return 'day'
  }
  if (/30|月/.test(text)) {
    return 'month'
  }
  if (/年|12/.test(text)) {
    return 'year'
  }
  return 'week'
}

function inferSourceType(url, title) {
  const text = `${url} ${title}`.toLowerCase()
  if (/gov|政府|通报|官方/.test(text)) {
    return '官方/权威来源'
  }
  if (/news|cnn|bbc|reuters|xinhua|people|央视|新华社|澎湃|财新|界面/.test(text)) {
    return '媒体来源'
  }
  return '公开来源'
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
      timeout: 20000
    }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Tavily request failed: ${response.statusCode} ${text.slice(0, 200)}`))
          return
        }
        try {
          resolve(JSON.parse(text))
        } catch (error) {
          reject(new Error('Tavily response is not valid JSON'))
        }
      })
    })

    request.on('timeout', () => {
      request.destroy(new Error('Tavily request timeout'))
    })
    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

module.exports = {
  buildTavilyPayload,
  normalizeTavilyResults,
  searchSources,
  shouldUseTavily
}
