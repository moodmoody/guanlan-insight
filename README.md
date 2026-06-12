# 观澜智析

观澜智析是一款微信原生小程序，用于 AI 多视角舆情分析、消息可信度评估和趋势参考。

## 导入方式

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择当前文件夹：`C:\Users\weife\Documents\Codex\weixinapp`。
4. AppID 使用：`wxbbeb882ac7ffed06`。
5. 开通云开发后，将云环境 ID 填入 `miniprogram/app.js` 的 `globalData.envId`。

## 当前版本

当前是云数据库 mock 版，包含：

- 首页分析入口
- 任务确认页
- 多智能体分析进度页
- 分析报告页
- 历史报告页
- 个人中心页
- `login`、`createTask`、`runAnalysis`、`listReports`、`getReport`、`submitFeedback` 云函数

报告由 `runAnalysis` 云函数生成并写入 `reports` 集合。配置 AI 环境变量后会调用真实模型；未配置或调用失败时会自动回退 mock 报告。

## 云开发配置

在云开发控制台创建这些集合：

- `tasks`
- `reports`
- `feedback`
- `users`
- `examples`

需要部署这些云函数：

- `login`
- `createTask`
- `runAnalysis`
- `listReports`
- `getReport`
- `submitFeedback`

## AI 接口配置

`runAnalysis` 使用 OpenAI-compatible Chat Completions 接口。你可以接 OpenAI、DeepSeek、通义千问兼容接口、智谱兼容接口等。

在云开发控制台为 `runAnalysis` 云函数配置环境变量：

- `AI_API_KEY`：模型服务 API Key
- `AI_MODEL`：模型名称，例如 `deepseek-chat`
- `AI_BASE_URL`：接口地址，可选；不填时使用 `https://api.openai.com/v1/chat/completions`
- `BING_SEARCH_API_KEY`：Bing Web Search API Key，可选；配置后 `runAnalysis` 会用必应中文搜索检索最新公开资料，再让 AI 基于资料分析

配置后重新部署 `runAnalysis` 云函数。真实 AI 不需要改小程序前端。
