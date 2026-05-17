/**
 * 第四阶段：HTML 页面渲染服务
 */

const { chatCompletion } = require('./ai');
const { RENDER_PAGE_SYSTEM, RENDER_MODIFY_SYSTEM } = require('../prompts/render');

/**
 * 渲染单页 HTML
 */
async function renderPage(session, pageNumber) {
  const { planning, brief } = session;
  if (!planning) throw new Error('策划稿不存在');

  const pages = planning.planning_draft?.pages || planning.pages || [];
  const page = pages.find((p) => p.page_number === pageNumber);
  if (!page) throw new Error(`第 ${pageNumber} 页不存在`);

  const style = planning.planning_draft?.style || brief?.research_brief?.style_suggestion || '现代专业风格';

  const result = await chatCompletion([
    { role: 'system', content: RENDER_PAGE_SYSTEM },
    {
      role: 'user',
      content: `请将以下策划卡片渲染为一个 1280×720px 的 HTML 演示页面。

整体风格：${style}

策划卡片内容：
${JSON.stringify(page, null, 2)}`,
    },
  ], { temperature: 0.6, maxTokens: 4000 });

  // 提取 HTML
  const html = extractHTML(result);
  return html;
}

/**
 * 批量渲染所有页面
 */
async function renderAllPages(session) {
  const { planning } = session;
  if (!planning) throw new Error('策划稿不存在');

  const pages = planning.planning_draft?.pages || planning.pages || [];
  const rendered = [];

  for (const page of pages) {
    const html = await renderPage(session, page.page_number);
    rendered.push({
      page_number: page.page_number,
      title: page.title,
      html,
    });
  }

  session.renderedPages = rendered;
  session.stage = 'export';
  return rendered;
}

function extractHTML(text) {
  // 去掉开头可能的文字说明
  let cleaned = text;

  // 尝试提取 ```html ... ``` 或 ``` ... ``` 代码块
  const codeBlock = cleaned.match(/```(?:html)?\s*\n?([\s\S]*?)```/);
  if (codeBlock) {
    cleaned = codeBlock[1].trim();
  }

  // 再次清理：去掉开头残留的 ```html 或 ```
  cleaned = cleaned.replace(/^```(?:html)?\s*\n?/, '').replace(/\n?```\s*$/, '');

  // 尝试提取 <!DOCTYPE html> ... </html>
  const doctype = cleaned.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
  if (doctype) return doctype[1].trim();

  // 尝试提取 <html> ... </html>
  const htmlTag = cleaned.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTag) return htmlTag[1].trim();

  // 如果包含 <div 或 <body 等标签，可能是片段 HTML
  if (cleaned.includes('<div') || cleaned.includes('<body')) {
    return cleaned;
  }

  // 兜底：包裹成完整 HTML
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:40px;font-family:"PingFang SC",sans-serif;background:#1a1a2e;color:#fff;}</style></head><body>${cleaned}</body></html>`;
}

module.exports = { renderPage, renderAllPages, modifyPage };

/**
 * 修改已渲染的页面
 */
async function modifyPage(session, pageNumber, instruction) {
  const existing = (session.renderedPages || []).find(p => p.page_number === pageNumber);
  if (!existing) throw new Error(`第 ${pageNumber} 页尚未渲染`);

  const result = await chatCompletion([
    { role: 'system', content: RENDER_MODIFY_SYSTEM },
    {
      role: 'user',
      content: `当前页面 HTML：\n${existing.html}\n\n用户修改要求：${instruction}`,
    },
  ], { temperature: 0.6, maxTokens: 4000 });

  const html = extractHTML(result);
  existing.html = html;
  return html;
}
