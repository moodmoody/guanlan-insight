const app = getApp()

Page({
  data: {
    reports: []
  },

  onShow() {
    wx.cloud.callFunction({
      name: 'listReports',
      data: { limit: 20 },
      success: (res) => {
        const reports = res.result.reports || []
        app.globalData.reports = reports
        this.setData({ reports })
      },
      fail: () => {
        this.setData({ reports: app.globalData.reports || [] })
      }
    })
  },

  goAnalyze() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  openReport(event) {
    wx.navigateTo({ url: `/pages/report/report?id=${event.currentTarget.dataset.id}` })
  }
})
