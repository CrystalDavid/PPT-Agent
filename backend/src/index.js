require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 对渲染接口设置长超时（5分钟）
app.use('/api/workflow/render', (req, res, next) => {
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
