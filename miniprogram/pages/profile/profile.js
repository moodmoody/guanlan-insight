Page({
  openLegal(event) {
    const type = event.currentTarget.dataset.type
    const routes = {
      agreement: '/pages/legal/user-agreement/user-agreement',
      privacy: '/pages/legal/privacy-policy/privacy-policy',
      ai: '/pages/legal/ai-disclaimer/ai-disclaimer'
    }
    const url = routes[type]
    if (url) {
      wx.navigateTo({ url })
    }
  }
})
