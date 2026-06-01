require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 防止未捕获异常导致进程退出
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT]', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 对渲染接口设置长超时（5分钟）
app.use('/api/workflow/render', (req, res, next) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  next();
});

// 导出接口也需要长超时（Puppeteer 截图/PDF 生成）
app.use('/api/workflow/export', (req, res, next) => {
  req.setTimeout(300000);
  res.setTimeout(300000);
  next();
});

// Routes
app.use('/api/workflow', require('./routes/workflow'));
app.use('/api/export', require('./routes/export'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const server = app.listen(PORT, () => {
  console.log(`PPT Agent backend running on port ${PORT}`);
});
server.timeout = 300000; // 5 min global timeout
