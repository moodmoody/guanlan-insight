const app = getApp()

Page({
  data: {
    report: null
  },

  onLoad(options) {
    this.reportId = options.id
    const reports = app.globalData.reports || []
    const report = reports.find((item) => item.id === options.id) || app.globalData.currentReport
    if (report) {
      this.setData({ report: formatReport(report) })
      return
    }

    wx.cloud.callFunction({
      name: 'getReport',
      data: { id: options.id },
      success: (res) => {
        this.setData({ report: formatReport(res.result.report) })
      },
      fail: () => {
        wx.showToast({ title: '报告不存在', icon: 'none' })
        wx.redirectTo({ url: '/pages/index/index' })
      }
    })
  },

  onShow() {
    if (!this.data.report && this.reportId) {
      wx.showLoading({ title: '加载报告' })
      wx.cloud.callFunction({
        name: 'getReport',
        data: { id: this.reportId },
        success: (res) => this.setData({ report: formatReport(res.result.report) }),
        complete: () => wx.hideLoading()
      })
      return
    }
  },

  onShareAppMessage() {
    return {
      title: `观澜智析：${this.data.report.query}`,
      path: '/pages/index/index'
    }
  },

  favoriteReport() {
    wx.showToast({ title: '已收藏', icon: 'success' })
  },

  reanalyze() {
    app.globalData.currentTask = {
      query: this.data.report.query,
      analysisType: this.data.report.analysisType,
      analysisLabel: this.data.report.analysisLabel,
      timeRange: this.data.report.timeRange,
      sourceType: this.data.report.sourceType,
      focus: ['事件脉络', '信息可信度', '观点阵营', '趋势参考']
    }
    wx.redirectTo({ url: '/pages/progress/progress' })
  },

  submitFeedback(event) {
    const value = event.currentTarget.dataset.value
    wx.cloud.callFunction({
      name: 'submitFeedback',
      data: {
        reportId: this.data.report.id || this.data.report._id,
        value,
        query: this.data.report.query
      }
    })
    const label = {
      useful: '感谢反馈',
      inaccurate: '已记录问题',
      missing: '已记录遗漏'
    }[value]
    wx.showToast({ title: label || '已记录', icon: 'none' })
  }
})

function formatReport(report) {
  const sections = (report.sections || []).map((section, index) => ({
    ...section,
    displayIndex: String(index + 1).padStart(2, '0')
  }))

  return {
    ...report,
    sections,
    credibilityScore: Number(report.credibility && report.credibility.score) || 0
  }
}
