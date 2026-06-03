const REPORT_SECTIONS = [
  { key: 'summary', title: '事件摘要' },
  { key: 'credibility', title: '信息可信度评估' },
  { key: 'timeline', title: '时间线' },
  { key: 'opinionGroups', title: '观点阵营' },
  { key: 'sentimentTrend', title: '情绪趋势' },
  { key: 'controversyPoints', title: '争议焦点' },
  { key: 'prediction', title: '走势预测' },
  { key: 'suggestions', title: '行动建议' }
]

function inferAnalysisType(query) {
  const text = String(query || '')
  if (/真假|假新闻|谣言|可信吗|甄别|核实|辟谣|可信度/.test(text)) {
    return 'credibility'
  }
  if (/未来|走势|趋势|发酵|预测|后续/.test(text)) {
    return 'trend'
  }
  if (/品牌|负面|风险|公关|危机/.test(text)) {
    return 'risk'
  }
  if (/对比|不同平台|态度差异|观点阵营/.test(text)) {
    return 'comparison'
  }
  return 'publicOpinion'
}

function getAnalysisLabel(type) {
  const labels = {
    credibility: '消息甄别',
    trend: '趋势预测',
    risk: '品牌风险',
    comparison: '观点对比',
    publicOpinion: '舆情分析'
  }
  return labels[type] || labels.publicOpinion
}

function buildMockReport(query, overrides) {
  const safeQuery = String(query || '热点事件分析').trim() || '热点事件分析'
  const analysisType = overrides && overrides.analysisType ? overrides.analysisType : inferAnalysisType(safeQuery)
  const createdAt = new Date()
  const credibility = {
    level: '待验证',
    score: 62,
    basis: [
      '当前信息需要结合原始信源、权威发布与多平台交叉材料继续验证',
      '部分传播内容存在转述链条较长、关键细节不完整的情况',
      '建议优先关注官方通报、主流媒体核查与一手材料'
    ]
  }

  const sections = [
    {
      key: 'summary',
      title: '事件摘要',
      body: `围绕“${safeQuery}”，当前舆论主要集中在事实确认、责任归因、情绪扩散和后续影响四个层面。`
    },
    {
      key: 'credibility',
      title: '信息可信度评估',
      body: '当前结论为待验证。建议将截图、短视频片段、单一转述与权威信源分开看待，避免把传播热度直接等同于事实强度。',
      items: credibility.basis
    },
    {
      key: 'timeline',
      title: '时间线',
      items: ['早期：话题由少量账号或单一材料触发', '扩散：多平台出现转述、评论和二次解读', '当前：讨论焦点转向责任、影响与后续回应']
    },
    {
      key: 'opinionGroups',
      title: '观点阵营',
      items: ['关注事实依据的一方：希望看到清晰证据链', '表达情绪与立场的一方：更关注事件影响和态度回应', '保持观望的一方：等待权威信息或更多材料']
    },
    {
      key: 'sentimentTrend',
      title: '情绪趋势',
      body: '情绪整体偏谨慎，若后续出现权威回应或关键反证，讨论热度可能快速分化。'
    },
    {
      key: 'controversyPoints',
      title: '争议焦点',
      items: ['原始消息来源是否清楚', '关键细节是否被截取或省略', '各方回应是否充分', '事件是否被情绪化传播放大']
    },
    {
      key: 'prediction',
      title: '走势预测',
      body: '未来 24-72 小时是走势分化窗口。如果出现权威回应，热度可能回落；如果出现新证据或反转材料，讨论会继续发酵。'
    },
    {
      key: 'suggestions',
      title: '行动建议',
      items: ['先保存原始材料和来源链接', '避免直接转发未经确认的截图或片段', '持续跟踪权威回应与多平台一致性', '将事实、观点和情绪分开判断']
    }
  ]

  return {
    query: safeQuery,
    analysisType,
    analysisLabel: getAnalysisLabel(analysisType),
    status: 'done',
    sourceType: 'user_input',
    timeRange: '近 7 天',
    credibility,
    riskLevel: analysisType === 'risk' ? '中' : '低',
    sections,
    createdAt,
    updatedAt: createdAt
  }
}

function buildReportDocument(options) {
  const report = buildMockReport(options.query, {
    analysisType: options.analysisType
  })
  return {
    ...report,
    taskId: options.taskId || '',
    openid: options.openid || '',
    timeRange: options.timeRange || report.timeRange,
    sourceType: options.sourceType || report.sourceType,
    deleted: false
  }
}

module.exports = {
  REPORT_SECTIONS,
  inferAnalysisType,
  getAnalysisLabel,
  buildMockReport,
  buildReportDocument
}
