const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../../output');

// 文件下载
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;

  // 安全检查：防止路径遍历
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: '无效的文件名' });
  }

  const filepath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  fs.createReadStream(filepath).pipe(res);
});

module.exports = router;
