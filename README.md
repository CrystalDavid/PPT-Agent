# PPT-Agent

通过对话把一个初步想法变成演示文稿。PPT-Agent 先访谈需求，再整理底稿、大纲与逐页策划，生成 SVG 页面，并导出 HTML、PDF 和可编辑 PPTX。

## 功能

- **需求访谈**：通过连续对话整理主题、受众、目标与素材。
- **分步创作**：底稿 → 大纲 → 逐页策划 → 页面渲染，每一步都可以反馈修改。
- **逐页调整**：预览页面，用自然语言修改指定页的内容与布局。
- **多格式导出**：HTML 演示页、PDF，以及将支持的 SVG 元素转成原生对象的 PPTX。
- **会话保存**：导出、导入会话 JSON，继续之前的创作。

## 快速启动

需要 Node.js 20+、npm 和可用的 DeepSeek API Key。

```bash
git clone https://github.com/CrystalDavid/PPT-Agent.git
cd PPT-Agent
npm install
npm run install:all
```

在 `backend/.env` 中填写：

```dotenv
PORT=3001
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

以上变量对应 [模型调用实现](backend/src/services/ai.js)。随后从仓库根目录启动：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。后端默认运行在 `3001`，可通过 [健康检查](http://localhost:3001/api/health) 确认启动。

## 使用流程

1. 输入演示主题，例如“为产品团队介绍一个 AI 备课助手，10 分钟，8 页”。
2. 回答访谈问题，检查并修改生成的底稿。
3. 生成大纲，确认叙事顺序后生成逐页策划。
4. 渲染页面，预览后继续调整单页或整体内容。
5. 下载 HTML、PDF 或 PPTX；需要稍后继续时导出会话 JSON。

后端会话保存在内存中，重启前可通过会话导出保存进度。PDF 导出使用 Puppeteer 启动 Chromium；PPTX 导出支持的 SVG 元素见 [转换器](backend/src/services/svgPptx.js)。

## 配置

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | — | 后端模型调用凭据 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` | 模型 API 地址 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 模型名称 |
| `PORT` | `3001` | 后端端口 |
| `NEXT_PUBLIC_BACKEND_ORIGIN` | `http://localhost:3001` | 前端连接的后端地址 |
| `NEXT_PUBLIC_WORKFLOW_API` | 后端地址 + `/api/workflow` | 前端工作流 API 地址 |

前端变量可写入 `frontend/.env.local`。生成文件保存在 `backend/output/`。

## 代码结构

| 路径 | 内容 |
| --- | --- |
| [frontend/src/app](frontend/src/app/) | Next.js 页面与样式 |
| [frontend/src/components](frontend/src/components/) | 访谈、底稿、大纲、策划、预览和导出界面 |
| [backend/src/routes](backend/src/routes/) | 工作流 API 与文件下载 |
| [backend/src/services](backend/src/services/) | 模型调用、创作步骤、会话与导出 |
| [backend/src/prompts](backend/src/prompts/) | 各阶段提示词 |
