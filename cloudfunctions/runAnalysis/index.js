const cloud = require('wx-server-sdk')
const { buildReportDocument } = require('./reportTemplate')
const { createAiReport, shouldUseAi } = require('./aiClient')
const { searchSources, shouldUseTavily } = require('./tavilyClient')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const now = new Date()
  const taskId = event.taskId || ''
  const query = String(event.query || '').trim()

  if (!query) {
    throw new Error('query is required')
  }

  let report
  let sources = []
  if (shouldUseTavily(process.env)) {
    try {
      sources = await searchSources({
        query,
        timeRange: event.timeRange
      })
    } catch (error) {
      console.error('Tavily search failed, continuing without sources:', error)
    }
  }

  try {
    report = shouldUseAi(process.env)
      ? await createAiReport({
        query,
        taskId,
        openid: wxContext.OPENID,
        analysisType: event.analysisType,
        timeRange: event.timeRange,
        sourceType: event.sourceType,
        sources
      })
      : buildReportDocument({
        query,
        taskId,
        openid: wxContext.OPENID,
        analysisType: event.analysisType,
        timeRange: event.timeRange,
        sourceType: event.sourceType
      })
    if (!report.sources) {
      report.sources = sources
    }
  } catch (error) {
    console.error('AI analysis failed, falling back to mock report:', error)
    report = buildReportDocument({
      query,
      taskId,
      openid: wxContext.OPENID,
      analysisType: event.analysisType,
      timeRange: event.timeRange,
      sourceType: event.sourceType
    })
    report.provider = 'mock_fallback'
    report.sources = sources
  }

  const addResult = await db.collection('reports').add({ data: report })

  if (taskId) {
    await db.collection('tasks').doc(taskId).update({
      data: {
        status: 'done',
        reportId: addResult._id,
        updatedAt: now
      }
    })
  }

  return {
    id: addResult._id,
    _id: addResult._id,
    ...report
  }
}
