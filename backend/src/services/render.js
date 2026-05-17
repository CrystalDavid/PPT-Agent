/**
 * 第四阶段：HTML 页面渲染服务
 */

const { chatCompletion } = require('./ai');
const { RENDER_PAGE_SYSTEM } = require('../prompts/render');

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
  // 尝试提取 ```html ... ``` 代码块
  const codeBlock = text.match(/```html\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();

  // 尝试提取 <!DOCTYPE html> ... </html>
  const doctype = text.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
  if (doctype) return doctype[1].trim();

  // 尝试提取 <html> ... </html>
  const htmlTag = text.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTag) return htmlTag[1].trim();

  // 兜底返回原文
  return text;
}

module.exports = { renderPage, renderAllPages };
