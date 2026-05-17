/**
 * 第五阶段：导出 PPTX / PDF 服务
 *
 * 策略：用 cheerio 解析渲染好的 HTML，提取文本内容和颜色信息，
 * 然后用 pptxgenjs 重建为原生 PPTX 幻灯片。
 */

const PptxGenJS = require('pptxgenjs');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../../output');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * 从 HTML 中提取背景色
 */
function extractBgColor(html) {
  const $ = cheerio.load(html);
  // 尝试从 .slide 或 body 的 style 中提取 background
  const slideEl = $('.slide').first();
  const bodyEl = $('body').first();

  const slideStyle = slideEl.attr('style') || '';
  const bodyStyle = bodyEl.attr('style') || '';
  const allStyles = $('style').text() || '';

  // 从 inline style 提取
  let bg = extractColorFromStyle(slideStyle, 'background')
    || extractColorFromStyle(bodyStyle, 'background')
    || extractColorFromCSS(allStyles, '.slide', 'background')
    || extractColorFromCSS(allStyles, 'body', 'background');

  if (bg) return bg;
  return 'FFFFFF'; // 默认白色
}

function extractColorFromStyle(style, prop) {
  const match = style.match(new RegExp(prop + '[^:]*:\\s*([^;]+)'));
  if (match) return cssColorToHex(match[1].trim());
  return null;
}

function extractColorFromCSS(css, selector, prop) {
  // 简单提取，不做完整 CSS 解析
  const selectorEscaped = selector.replace('.', '\\.');
  const blockMatch = css.match(new RegExp(selectorEscaped + '\\s*\\{([^}]+)\\}'));
  if (blockMatch) {
    return extractColorFromStyle(blockMatch[1], prop);
  }
  return null;
}

function cssColorToHex(color) {
  color = color.trim().split(/\s+/)[0]; // 取第一个值（忽略 background 简写的其他部分）

  // hex
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return hex.toUpperCase();
  }

  // rgb()
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return (r + g + b).toUpperCase();
  }

  // 常见颜色名
  const names = {
    white: 'FFFFFF', black: '000000', red: 'FF0000', blue: '0000FF',
    green: '008000', navy: '000080', darkblue: '00008B', '#1a1a2e': '1A1A2E',
  };
  return names[color.toLowerCase()] || null;
}

/**
 * 从 HTML 提取结构化内容用于 PPTX
 */
function extractSlideContent(html) {
  const $ = cheerio.load(html);
  const slide = $('.slide').first();
  if (!slide.length) return { title: '', sections: [] };

  const elements = [];

  // 提取所有文本块，保留层级
  slide.find('h1, h2, h3, h4, h5, h6, p, li, td, th, span, div').each(function() {
    const el = $(this);
    const text = el.clone().children().remove().end().text().trim();
    if (!text) return;

    const tag = this.tagName.toLowerCase();
    const style = el.attr('style') || '';
    const parentStyle = el.parent().attr('style') || '';

    let fontSize = 14;
    let bold = false;
    let color = null;

    if (tag === 'h1') { fontSize = 28; bold = true; }
    else if (tag === 'h2') { fontSize = 22; bold = true; }
    else if (tag === 'h3') { fontSize = 18; bold = true; }
    else if (tag === 'h4') { fontSize = 16; bold = true; }
    else if (tag === 'th') { fontSize = 13; bold = true; }
    else if (tag === 'li' || tag === 'td') { fontSize = 13; }
    else if (tag === 'p') { fontSize = 14; }

    // 从 style 提取字号
    const fsMatch = style.match(/font-size:\s*([\d.]+)px/);
    if (fsMatch) fontSize = Math.round(parseFloat(fsMatch[1]) * 0.75); // px to pt

    // 从 style 提取颜色
    const colorMatch = style.match(/(?:^|;)\s*color:\s*([^;]+)/);
    if (colorMatch) color = cssColorToHex(colorMatch[1].trim());

    // 从 style 提取粗体
    if (style.includes('font-weight') && (style.includes('bold') || style.includes('700') || style.includes('600'))) {
      bold = true;
    }

    elements.push({ text, tag, fontSize, bold, color });
  });

  return elements;
}

/**
 * 将渲染好的 HTML 页面转为 PPTX
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

  for (const rendered of renderedPages) {
    const slide = pptx.addSlide();

    // 提取背景色
    const bgColor = extractBgColor(rendered.html);
    slide.background = { color: bgColor };

    // 提取内容
    const elements = extractSlideContent(rendered.html);

    if (elements.length === 0) {
      // 兜底：如果提取不到内容，用标题 + 策划数据
      const pageData = (planning?.planning_draft?.pages || planning?.pages || [])
        .find(p => p.page_number === rendered.page_number);

      slide.addText(rendered.title || `第 ${rendered.page_number} 页`, {
        x: 0.5, y: 0.5, w: 12, h: 0.8,
        fontSize: 28, bold: true, color: bgColor === 'FFFFFF' ? '333333' : 'FFFFFF',
        fontFace: 'PingFang SC',
      });

      if (pageData?.core_messages) {
        slide.addText(
          pageData.core_messages.map(msg => ({ text: msg, options: { bullet: { code: '2022' } } })),
          { x: 0.5, y: 1.5, w: 12, h: 5, fontSize: 14, color: bgColor === 'FFFFFF' ? '555555' : 'DDDDDD', fontFace: 'PingFang SC', valign: 'top', lineSpacingMultiple: 1.6 }
        );
      }
      continue;
    }

    // 根据提取的元素构建幻灯片
    let yPos = 0.4;
    const defaultColor = bgColor === 'FFFFFF' || bgColor === 'F8FAFC' || bgColor === 'F6F8FB' ? '333333' : 'FFFFFF';

    for (const el of elements) {
      if (yPos > 6.8) break; // 防止溢出

      const textColor = el.color || defaultColor;
      const height = el.tag.startsWith('h') ? 0.6 : 0.4;

      slide.addText(el.text, {
        x: 0.5,
        y: yPos,
        w: 12.3,
        h: height,
        fontSize: el.fontSize,
        bold: el.bold,
        color: textColor,
        fontFace: 'PingFang SC',
        valign: 'middle',
        wrap: true,
      });

      yPos += height + (el.tag.startsWith('h') ? 0.15 : 0.05);
    }
  }

  const filename = `ppt-agent-${session.id.substring(0, 8)}-${Date.now()}.pptx`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await pptx.writeFile({ fileName: filepath });

  return { filename, filepath };
}

/**
 * 导出 HTML 打包文件
 */
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
        <iframe srcdoc="${escapeHtml(p.html)}" width="1280" height="720" frameborder="0"></iframe>
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
    body { background: #f1f5f9; font-family: "PingFang SC", sans-serif; padding: 40px; }
    h1 { color: #1e293b; margin-bottom: 32px; font-size: 24px; }
    .slide-wrapper { margin-bottom: 48px; }
    .slide-label { color: #64748b; font-size: 14px; margin-bottom: 8px; }
    .slide-frame { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); background: #fff; }
    .slide-frame iframe { display: block; }
  </style>
</head>
<body>
  <h1>PPT Agent - 演示文稿预览</h1>
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
