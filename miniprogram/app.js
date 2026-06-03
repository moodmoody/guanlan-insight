App({
  globalData: {
    envId: 'cloud1-d4gbu5bpbce2f5431',
    currentTask: null,
    reports: []
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.envId || undefined,
        traceUser: true
      })
    }
  }
})
