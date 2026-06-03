# 观澜智析云函数

当前提供云开发分析链路：`createTask` 创建任务，`runAnalysis` 生成报告并写入 `reports` 集合，`listReports/getReport` 读取报告，`submitFeedback` 保存反馈。

`runAnalysis` 支持 OpenAI-compatible Chat Completions。配置 `AI_API_KEY` 和 `AI_MODEL` 后调用真实模型；未配置或调用失败时自动回退 mock 报告。

建议集合：

- `users`
- `tasks`
- `reports`
- `feedback`
- `examples`
