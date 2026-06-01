/**
 * 第五阶段：导出 PDF / HTML 服务
 */

const path = require('path');
const fs = require('fs');
const { exportSvgPagesToPptx } = require('./svgPptx');

const OUTPUT_DIR = path.join(__dirname, '../../output');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// ============================================================
// Puppeteer 辅助：启动浏览器
// ============================================================

let _browserPromise = null;

async function getBrowser() {
  if (_browserPromise) return _browserPromise;
  _browserPromise = (async () => {
    const puppeteer = require('puppeteer');
    return puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
  })();
  return _browserPromise;
}

// ============================================================
// PDF 导出（Puppeteer 渲染每页 → 合并为 PDF）
// ============================================================

async function exportPdf(session) {
  ensureOutputDir();

  const { renderedPages } = session;
  if (!renderedPages || renderedPages.length === 0) {
    throw new Error('没有已渲染的页面');
  }

  const browser = await getBrowser();

  const slidesHtml = renderedPages.map((p) => {
    return `<div class="page-break">
      <iframe srcdoc="${escapeHtml(p.html)}" width="1280" height="720" frameborder="0" scrolling="no"></iframe>
    </div>`;
  }).join('\n');

  const wrapperHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; }
  body { width: 1280px; }
  .page-break { width: 1280px; height: 720px; overflow: hidden; page-break-after: always; }
  .page-break iframe { display: block; width: 1280px; height: 720px; border: none; }
</style>
</head>
<body>${slidesHtml}</body>
</html>`;

  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 720 });
    await page.setContent(wrapperHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

    const filename = `ppt-agent-${session.id.substring(0, 8)}-${Date.now()}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.pdf({
      path: filepath,
      width: '1280px',
      height: '720px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return { filename, filepath };
  } finally {
    await page.close();
  }
}

// ============================================================
// HTML 导出
// ============================================================

function exportHtmlBundle(session) {
  ensureOutputDir();

  const { renderedPages } = session;
  if (!renderedPages || renderedPages.length === 0) {
    throw new Error('没有已渲染的页面');
  }

  const pagesHtml = renderedPages.map((p) => `
    <div class="slide-wrapper">
      <div class="slide-label">第 ${p.page_number} 页 — ${p.title}</div>
      <div class="slide-frame">
        <iframe srcdoc="${escapeHtml(p.html)}" frameborder="0"></iframe>
      </div>
    </div>
  `).join('\n');

  const bundleHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>PPT Agent - 演示文稿</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f1f5f9; font-family: "PingFang SC", sans-serif; padding: 40px; max-width: 1100px; margin: 0 auto; }
    h1 { color: #1e293b; margin-bottom: 32px; font-size: 24px; }
    .slide-wrapper { margin-bottom: 48px; }
    .slide-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
    .slide-frame {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      background: #fff;
      aspect-ratio: 16 / 9;
    }
    .slide-frame iframe {
      display: block;
      width: 1280px;
      height: 720px;
      border: none;
      transform-origin: top left;
    }
  </style>
</head>
<body>
  <h1>PPT Agent - 演示文稿预览</h1>
  ${pagesHtml}
  <script>
    function scaleFrames() {
      document.querySelectorAll('.slide-frame').forEach(function(frame) {
        var iframe = frame.querySelector('iframe');
        if (!iframe) return;
        var scale = frame.clientWidth / 1280;
        iframe.style.transform = 'scale(' + scale + ')';
      });
    }
    window.addEventListener('load', scaleFrames);
    window.addEventListener('resize', scaleFrames);
  </script>
</body>
</html>`;

  const filename = `ppt-agent-${session.id.substring(0, 8)}-${Date.now()}.html`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, bundleHtml, 'utf8');

  return { filename, filepath };
}

// ============================================================
// PPTX 导出（SVG → DrawingML 原生可编辑对象）
// ============================================================

async function exportPptx(session) {
  ensureOutputDir();

  const { renderedPages } = session;
  if (!renderedPages || renderedPages.length === 0) {
    throw new Error('没有已渲染的页面');
  }

  const pages = renderedPages.map((page) => {
    const svg = page.svg || extractSvg(page.html);
    if (!svg) {
      throw new Error(`第 ${page.page_number} 页缺少 SVG 内容`);
    }
    return { ...page, svg };
  });

  const filename = `ppt-agent-${session.id.substring(0, 8)}-${Date.now()}.pptx`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await exportSvgPagesToPptx(pages, filepath);

  return { filename, filepath };
}

// ============================================================
// 辅助函数
// ============================================================

function escapeHtml(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function extractSvg(html) {
  const match = String(html || '').match(/(<svg[\s\S]*<\/svg>)/i);
  return match ? match[1] : '';
}

module.exports = { exportPdf, exportHtmlBundle, exportPptx };
