const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const now = new Date()
  const data = {
    openid: wxContext.OPENID,
    query: event.query,
    analysisType: event.analysisType || 'publicOpinion',
    status: 'created',
    timeRange: event.timeRange || '近 7 天',
    sourceType: event.sourceType || 'user_input',
    createdAt: now,
    updatedAt: now
  }
  const result = await db.collection('tasks').add({ data })
  return {
    id: result._id,
    ...data
  }
}
