const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const now = new Date()
  const feedback = {
    openid: wxContext.OPENID,
    reportId: event.reportId || '',
    value: event.value || 'unknown',
    query: event.query || '',
    createdAt: now
  }
  const result = await db.collection('feedback').add({ data: feedback })
  return {
    id: result._id,
    ...feedback
  }
}
