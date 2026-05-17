/**
 * 第五阶段：导出 PPTX / PDF 服务
 */

const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '../../output');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * 将渲染好的 HTML 页面转为 PPTX
 * 策略：每页作为一个 slide，用 HTML 内容截图嵌入或用文本框重建
 * 这里采用简化方案：将每页 HTML 作为 web object 嵌入 + 文本摘要
 */
async function exportPptx(session) {
  ensureOutputDir();

  const { renderedPages, planning, brief } = session;
  if (!renderedPages || renderedPages.length === 0) {
    throw new Error('没有已渲染的页面');
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'PPT Agent';
  pptx.title = brief?.research_brief?.topic_summary || 'PPT Agent 生成';

  const pages = planning?.planning_draft?.pages || planning?.pages || [];

  for (const rendered of renderedPages) {
    const slide = pptx.addSlide();
    slide.background = { color: '1a1a2e' };

    const pageData = pages.find((p) => p.page_number === rendered.page_number);

    // 标题
    slide.addText(rendered.title || `第 ${rendered.page_number} 页`, {
      x: 0.5,
      y: 0.3,
      w: 12,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'PingFang SC',
    });

    // 核心信息
    if (pageData?.core_messages) {
      const bulletText = pageData.core_messages.map((msg) => ({
        text: msg,
        options: { fontSize: 14, color: 'E0E0E0', bullet: { code: '2022' } },
      }));
      slide.addText(bulletText, {
        x: 0.5,
        y: 1.2,
        w: 11.5,
        h: 4.5,
        fontFace: 'PingFang SC',
        valign: 'top',
        lineSpacingMultiple: 1.5,
      });
    }

    // 底部标注
    if (pageData?.visual_type) {
      slide.addText(`推荐视觉：${pageData.visual_type}`, {
        x: 0.5,
        y: 6.8,
        w: 12,
        h: 0.3,
        fontSize: 10,
        color: '888888',
        fontFace: 'PingFang SC',
      });
    }
  }

  const filename = `ppt-agent-${session.id.substring(0, 8)}-${Date.now()}.pptx`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await pptx.writeFile({ fileName: filepath });

  return { filename, filepath };
}

/**
 * 将 HTML 页面打包为可下载的 HTML 文件（作为 PDF 的替代方案）
 * 真正的 PDF 导出需要 puppeteer，这里先提供 HTML 打包
 */
function exportHtmlBundle(session) {
  ensureOutputDir();

  const { renderedPages } = session;
  if (!renderedPages || renderedPages.length === 0) {
    throw new Error('没有已渲染的页面');
  }

  // 生成一个包含所有页面的 HTML 文件
  const pagesHtml = renderedPages.map((p, idx) => `
    <div class="slide-container" id="slide-${p.page_number}">
      <div class="slide-label">第 ${p.page_number} 页 - ${p.title}</div>
      <div class="slide-frame">
        <iframe srcdoc="${escapeHtml(p.html)}" width="1280" height="720" frameborder="0"></iframe>
      </div>
    </div>
  `).join('\n');

  const bundleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>PPT Agent - 演示文稿预览</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f1a; font-family: "PingFang SC", sans-serif; padding: 40px; }
    .slide-container { margin-bottom: 40px; }
    .slide-label { color: #888; font-size: 14px; margin-bottom: 8px; }
    .slide-frame { border-radius: 8px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
    .slide-frame iframe { display: block; transform-origin: top left; }
  </style>
</head>
<body>
  <h1 style="color:#fff;margin-bottom:32px;font-size:24px;">PPT Agent - 全部页面预览</h1>
  ${pagesHtml}
</body>
</html>`;

  const filename = `ppt-agent-${session.id.substring(0, 8)}-${Date.now()}.html`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, bundleHtml, 'utf8');

  return { filename, filepath };
}

function escapeHtml(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { exportPptx, exportHtmlBundle };
