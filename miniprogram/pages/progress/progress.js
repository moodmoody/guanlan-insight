const app = getApp()
const { buildMockReport } = require('../../utils/reportTemplate')

Page({
  data: {
    task: null,
    progress: 12,
    agents: [
      { name: '事实梳理', desc: '提炼事件主体、时间和关键细节', done: false },
      { name: '信源核验', desc: '检查来源一致性与疑点线索', done: false },
      { name: '观点聚类', desc: '归纳不同立场与核心论点', done: false },
      { name: '情绪分析', desc: '观察情绪强度和变化方向', done: false },
      { name: '趋势研判', desc: '评估未来发酵窗口与风险点', done: false },
      { name: '建议生成', desc: '整理可执行的判断参考', done: false }
    ]
  },

  onLoad() {
    const task = app.globalData.currentTask
    if (!task) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }
    this.setData({ task })
    this.startMockProgress()
  },

  onUnload() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },

  startMockProgress() {
    let step = 0
    this.timer = setInterval(() => {
      step += 1
      const agents = this.data.agents.map((agent, index) => ({
        ...agent,
        done: index < step
      }))
      const progress = Math.min(100, 12 + step * 16)
      this.setData({ agents, progress })

      if (progress >= 100) {
        clearInterval(this.timer)
        this.runAnalysis()
      }
    }, 650)
  },

  runAnalysis() {
    const task = this.data.task
    wx.cloud.callFunction({
      name: 'runAnalysis',
      data: {
        taskId: task.id,
        query: task.query,
        analysisType: task.analysisType,
        timeRange: task.timeRange,
        sourceType: task.sourceType
      },
      success: (res) => {
        const report = res.result
        app.globalData.reports = [report, ...(app.globalData.reports || [])]
        app.globalData.currentReport = report
        wx.redirectTo({ url: `/pages/report/report?id=${report.id || report._id}` })
      },
      fail: () => {
        const report = buildMockReport(task.query, {
          analysisType: task.analysisType
        })
        app.globalData.reports = [report, ...(app.globalData.reports || [])]
        app.globalData.currentReport = report
        wx.showToast({ title: '使用本地模拟报告', icon: 'none' })
        wx.redirectTo({ url: `/pages/report/report?id=${report.id}` })
      }
    })
  }
})
