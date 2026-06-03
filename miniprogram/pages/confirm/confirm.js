const app = getApp()

Page({
  data: {
    task: null,
    ranges: ['近 24 小时', '近 7 天', '近 30 天']
  },

  onLoad() {
    const task = app.globalData.currentTask
    if (!task) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }
    this.setData({ task })
  },

  setRange(event) {
    const timeRange = event.currentTarget.dataset.value
    const task = { ...this.data.task, timeRange }
    app.globalData.currentTask = task
    this.setData({ task })
  },

  confirmTask() {
    wx.showLoading({ title: '创建任务' })
    const task = {
      ...this.data.task,
      status: 'running',
      createdAt: new Date().toISOString()
    }

    wx.cloud.callFunction({
      name: 'createTask',
      data: task,
      success: (res) => {
        app.globalData.currentTask = {
          ...task,
          id: res.result.id
        }
        wx.navigateTo({ url: '/pages/progress/progress' })
      },
      fail: () => {
        app.globalData.currentTask = task
        wx.showToast({ title: '使用本地演示流程', icon: 'none' })
        wx.navigateTo({ url: '/pages/progress/progress' })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
