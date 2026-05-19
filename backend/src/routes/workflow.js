const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { createSession, getSession } = require('../services/session');
const { handleInterviewMessage } = require('../services/interview');
const { generateOutline, refineOutline } = require('../services/outline');
const { generatePlanning, refinePlanningPage } = require('../services/planning');
const { renderPage, renderAllPages, modifyPage } = require('../services/render');
const { exportPdf, exportHtmlBundle } = require('../services/export');

// ============================================================
// 统一对话入口
// ============================================================
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    let session;
    if (sessionId) session = getSession(sessionId);
    if (!session) {
      const id = uuidv4();
      session = createSession(id);
    }

    session.messages.push({ role: 'user', content: message.trim(), timestamp: Date.now() });

    let result;
    if (session.stage === 'interview') {
      result = await handleInterviewMessage(session, message.trim());
    } else {
      result = { reply: '请使用对应阶段的专用端点', action: 'pending' };
    }

    session.messages.push({ role: 'assistant', content: result.reply, timestamp: Date.now() });

    res.json({
      sessionId: session.id,
      stage: session.stage,
      interviewStep: session.interviewStep,
      reply: result.reply,
      action: result.action,
      brief: result.brief || null,
    });
  } catch (err) {
    console.error('Workflow chat error:', err);
    res.status(500).json({ error: err.message || '服务器内部错误' });
  }
});

// ============================================================
// Step 1.5: 获取调研底稿
// ============================================================
router.get('/brief/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: '会话不存在' });
  if (!session.brief) return res.status(404).json({ error: '底稿尚未生成' });
  res.json({ brief: session.brief });
});

// 修改调研底稿
router.post('/brief/refine', async (req, res) => {
  try {
    const { sessionId, feedback } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.brief) return res.status(400).json({ error: '底稿尚未生成' });

    const { refineBrief } = require('../services/brief');
    const brief = await refineBrief(session, feedback);
    res.json({ sessionId: session.id, brief });
  } catch (err) {
    console.error('Brief refine error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Step 2: 生成大纲
// ============================================================
router.post('/outline', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.brief) return res.status(400).json({ error: '请先完成访谈生成底稿' });

    const outline = await generateOutline(session);
    res.json({ sessionId: session.id, stage: session.stage, outline });
  } catch (err) {
    console.error('Outline error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/outline/refine', async (req, res) => {
  try {
    const { sessionId, feedback } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.outline) return res.status(400).json({ error: '请先生成大纲' });

    const outline = await refineOutline(session, feedback);
    res.json({ sessionId: session.id, stage: session.stage, outline });
  } catch (err) {
    console.error('Outline refine error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Step 3: 生成策划稿
// ============================================================
router.post('/planning', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.outline) return res.status(400).json({ error: '请先生成大纲' });

    const planning = await generatePlanning(session);
    res.json({ sessionId: session.id, stage: session.stage, planning });
  } catch (err) {
    console.error('Planning error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/planning/refine', async (req, res) => {
  try {
    const { sessionId, pageNumber, feedback } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.planning) return res.status(400).json({ error: '请先生成策划稿' });

    const planning = await refinePlanningPage(session, pageNumber, feedback);
    res.json({ sessionId: session.id, stage: session.stage, planning });
  } catch (err) {
    console.error('Planning refine error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/planning/refine-all', async (req, res) => {
  try {
    const { sessionId, feedback } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.planning) return res.status(400).json({ error: '请先生成策划稿' });

    const { refinePlanningAll } = require('../services/planning');
    const planning = await refinePlanningAll(session, feedback);
    res.json({ sessionId: session.id, stage: session.stage, planning });
  } catch (err) {
    console.error('Planning refine-all error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Step 4: 渲染 HTML 页面
// ============================================================
router.post('/render', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.planning) return res.status(400).json({ error: '请先生成策划稿' });

    const pages = await renderAllPages(session);
    res.json({ sessionId: session.id, stage: session.stage, pages });
  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 渲染单页
router.post('/render/page', async (req, res) => {
  try {
    const { sessionId, pageNumber } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });

    const html = await renderPage(session, pageNumber);

    // 存储到 session 以便导出使用
    if (!session.renderedPages) session.renderedPages = [];
    const existing = session.renderedPages.find(p => p.page_number === pageNumber);
    if (existing) {
      existing.html = html;
    } else {
      const pages = session.planning?.planning_draft?.pages || session.planning?.pages || [];
      const pageData = pages.find(p => p.page_number === pageNumber);
      session.renderedPages.push({ page_number: pageNumber, title: pageData?.title || `第${pageNumber}页`, html });
    }

    res.json({ sessionId: session.id, pageNumber, html });
  } catch (err) {
    console.error('Render page error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 修改已渲染的页面
router.post('/render/modify', async (req, res) => {
  try {
    const { sessionId, pageNumber, instruction } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });

    const html = await modifyPage(session, pageNumber, instruction);
    res.json({ sessionId: session.id, pageNumber, html });
  } catch (err) {
    console.error('Render modify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Step 5: 导出
// ============================================================
router.post('/export/html', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.renderedPages) return res.status(400).json({ error: '请先渲染页面' });

    const { filename, filepath } = exportHtmlBundle(session);
    res.json({ sessionId: session.id, filename, downloadUrl: `/api/export/download/${filename}` });
  } catch (err) {
    console.error('Export HTML error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/export/pdf', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (!session.renderedPages) return res.status(400).json({ error: '请先渲染页面' });

    const { filename, filepath } = await exportPdf(session);
    res.json({ sessionId: session.id, filename, downloadUrl: `/api/export/download/${filename}` });
  } catch (err) {
    console.error('Export PDF error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
