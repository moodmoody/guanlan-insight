const app = getApp()
const { inferAnalysisType, getAnalysisLabel } = require('../../utils/reportTemplate')

Page({
  data: {
    query: '',
    quotaLeft: 3,
    tags: ['事件脉络', '观点聚类', '情绪趋势', '信息甄别', '争议焦点', '趋势预测'],
    examples: [
      '分析某品牌近期负面舆情的主要原因和后续走势',
      '这个热点事件目前有哪些主要观点阵营？',
      '帮我判断这个话题未来 7 天是否可能继续发酵',
      '这条消息可信吗？帮我找出可能的疑点',
      '对比不同平台用户对这件事的态度差异'
    ]
  },

  onInput(event) {
    this.setData({ query: event.detail.value })
  },

  useExample(event) {
    this.setData({ query: event.currentTarget.dataset.value })
  },

  pasteLink() {
    wx.getClipboardData({
      success: (res) => this.setData({ query: res.data || this.data.query })
    })
  },

  pasteText() {
    wx.getClipboardData({
      success: (res) => this.setData({ query: res.data || this.data.query })
    })
  },

  goHistory() {
    wx.switchTab({ url: '/pages/history/history' })
  },

  startAnalysis() {
    const query = this.data.query.trim()
    if (!query) {
      wx.showToast({ title: '请先输入分析需求', icon: 'none' })
      return
    }

    const analysisType = inferAnalysisType(query)
    app.globalData.currentTask = {
      query,
      analysisType,
      analysisLabel: getAnalysisLabel(analysisType),
      timeRange: '近 7 天',
      sourceType: query.startsWith('http') ? 'link' : 'user_input',
      focus: ['事件脉络', '信息可信度', '观点阵营', '趋势参考']
    }

    wx.navigateTo({ url: '/pages/confirm/confirm' })
  }
})
