const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const reportId = event.id || event.reportId

  if (!reportId) {
    throw new Error('report id is required')
  }

  const result = await db.collection('reports').doc(reportId).get()
  const report = result.data

  if (!report || report.openid !== wxContext.OPENID || report.deleted) {
    throw new Error('report not found')
  }

  return {
    report: {
      id: report._id,
      ...report
    }
  }
}
