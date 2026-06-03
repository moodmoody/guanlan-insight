const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const limit = Math.min(Number(event.limit) || 20, 50)
  const result = await db.collection('reports')
    .where({
      openid: wxContext.OPENID,
      deleted: false
    })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  return {
    reports: result.data.map((report) => ({
      id: report._id,
      ...report
    }))
  }
}
