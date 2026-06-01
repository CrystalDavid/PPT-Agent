/**
 * 第四阶段：SVG 页面渲染服务
 */

const fs = require('fs');
const path = require('path');
const { chatCompletion } = require('./ai');
const { RENDER_PAGE_SYSTEM, RENDER_MODIFY_SYSTEM } = require('../prompts/render');

const OUTPUT_DIR = path.join(__dirname, '../../output');

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function getSvgProjectDir(session) {
  ensureOutputDir();
  const dir = path.join(OUTPUT_DIR, `ppt-agent-${session.id.substring(0, 8)}-svg`);
  const svgDir = path.join(dir, 'svg_output');
  fs.mkdirSync(svgDir, { recursive: true });
  session.svgProjectDir = dir;
  return dir;
}

function saveSvgPage(session, pageNumber, svg) {
  const projectDir = getSvgProjectDir(session);
  const filename = `${String(pageNumber).padStart(2, '0')}_slide.svg`;
  const filepath = path.join(projectDir, 'svg_output', filename);
  fs.writeFileSync(filepath, svg, 'utf8');
  return filepath;
}

/**
 * 渲染单页 SVG
 */
async function renderPage(session, pageNumber) {
  const { planning, brief } = session;
  if (!planning) throw new Error('策划稿不存在');

  const pages = planning.planning_draft?.pages || planning.pages || [];
  const page = pages.find((p) => p.page_number === pageNumber);
  if (!page) throw new Error(`第 ${pageNumber} 页不存在`);

  const style = planning.planning_draft?.style || brief?.research_brief?.style_suggestion || '现代专业风格';
  const deckContext = buildDeckContext(session, pageNumber);

  const raw = await chatCompletion([
    { role: 'system', content: RENDER_PAGE_SYSTEM },
    {
      role: 'user',
      content: `请将以下策划卡片渲染为一个 1280×720px 的 SVG 演示页面。

整体风格：${style}

全局上下文（用于保持整套 PPT 一致）：
${deckContext}

当前策划卡片：
${JSON.stringify(page, null, 2)}`,
    },
  ], { temperature: 0.48, maxTokens: 7000 });

  const svg = await extractValidateOrRepair(raw, {
    mode: 'render',
    page,
    style,
    deckContext,
  });
  saveSvgPage(session, pageNumber, svg);
  return { svg, html: svgToHtml(svg) };
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
    const result = await renderPage(session, page.page_number);
    rendered.push({
      page_number: page.page_number,
      title: page.title,
      svg: result.svg,
      html: result.html,
    });
  }

  session.renderedPages = rendered;
  session.stage = 'export';
  return rendered;
}

/**
 * 修改已渲染的页面
 */
async function modifyPage(session, pageNumber, instruction) {
  const existing = (session.renderedPages || []).find(p => p.page_number === pageNumber);
  if (!existing) throw new Error(`第 ${pageNumber} 页尚未渲染`);

  const raw = await chatCompletion([
    { role: 'system', content: RENDER_MODIFY_SYSTEM },
    {
      role: 'user',
      content: `当前页面 SVG：\n${existing.svg || htmlToSvg(existing.html)}\n\n用户修改要求：${instruction}`,
    },
  ], { temperature: 0.35, maxTokens: 7000 });

  const svg = await extractValidateOrRepair(raw, {
    mode: 'modify',
    instruction,
    originalSvg: existing.svg || htmlToSvg(existing.html),
  });
  existing.svg = svg;
  existing.html = svgToHtml(svg);
  saveSvgPage(session, pageNumber, svg);
  return { svg, html: existing.html };
}

function buildDeckContext(session, pageNumber) {
  const planning = session.planning?.planning_draft || session.planning || {};
  const pages = planning.pages || [];
  const titles = pages.map(p => `${p.page_number}. ${p.title}`).join('\n');
  const currentIndex = pages.findIndex(p => p.page_number === pageNumber);
  const prev = currentIndex > 0 ? pages[currentIndex - 1]?.title : '无';
  const next = currentIndex >= 0 && currentIndex < pages.length - 1 ? pages[currentIndex + 1]?.title : '无';

  return [
    `整套页数：${pages.length || '未知'}`,
    `当前页：${pageNumber}`,
    `上一页：${prev}`,
    `下一页：${next}`,
    `整体风格：${planning.style || '现代专业风格'}`,
    `页面列表：\n${titles}`,
  ].join('\n');
}

async function extractValidateOrRepair(text, context) {
  let svg = normalizeSvgTextBoxes(sanitizeSvg(extractSVG(text)));
  let errors = validateSVG(svg);
  if (errors.length === 0) return svg;

  const repairPrompt = `下面的 SVG 不符合可编辑 PPTX 导出规范，请只输出修复后的完整 SVG。

错误：
${errors.map(e => `- ${e}`).join('\n')}

硬性要求：
- 1280×720，viewBox="0 0 1280 720"
- 只用 svg/g/rect/circle/ellipse/line/text/tspan
- 每个 text 必须有 data-w 和 data-h
- 不能有文字重叠、溢出、乱码风险
- 不要输出解释文字

待修复 SVG：
${svg}`;

  const repaired = await chatCompletion([
    { role: 'system', content: context.mode === 'modify' ? RENDER_MODIFY_SYSTEM : RENDER_PAGE_SYSTEM },
    { role: 'user', content: repairPrompt },
  ], { temperature: 0.18, maxTokens: 7000, retries: 2 });

  svg = normalizeSvgTextBoxes(sanitizeSvg(extractSVG(repaired)));
  errors = validateSVG(svg);
  if (errors.length > 0) {
    throw new Error(`SVG 生成不符合导出规范：${errors.join('；')}`);
  }
  return svg;
}

function extractSVG(text) {
  let cleaned = String(text || '').trim();

  const codeBlock = cleaned.match(/```(?:svg|xml)?\s*\n?([\s\S]*?)```/i);
  if (codeBlock) cleaned = codeBlock[1].trim();

  cleaned = cleaned.replace(/^```(?:svg|xml)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  const svgMatch = cleaned.match(/(<svg[\s\S]*<\/svg>)/i);
  if (svgMatch) return svgMatch[1].trim();

  throw new Error('AI 没有输出完整 SVG');
}

function sanitizeSvg(svg) {
  return String(svg || '')
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&copy;/g, '©')
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
    .trim();
}

function normalizeSvgTextBoxes(svg) {
  return String(svg || '').replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (match, attrs, content) => {
    let nextAttrs = attrs || '';
    const fontSize = readFontSize(nextAttrs);
    const lineCount = getTextLineCount(content);

    if (!hasSvgAttr(nextAttrs, 'font-family')) {
      nextAttrs += ' font-family="Microsoft YaHei"';
    }
    if (!hasSvgAttr(nextAttrs, 'data-w')) {
      nextAttrs += ` data-w="${estimateTextWidth(nextAttrs, content, fontSize)}"`;
    }
    if (!hasSvgAttr(nextAttrs, 'data-h')) {
      nextAttrs += ` data-h="${estimateTextHeight(fontSize, lineCount)}"`;
    }

    return `<text${nextAttrs}>${content}</text>`;
  });
}

function hasSvgAttr(attrs, name) {
  return new RegExp(`\\b${escapeRegExp(name)}\\s*=`, 'i').test(attrs || '');
}

function getSvgAttr(attrs, name) {
  const match = String(attrs || '').match(new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? match[1] : null;
}

function readFontSize(attrs) {
  const attrSize = parseFloat(getSvgAttr(attrs, 'font-size'));
  if (Number.isFinite(attrSize) && attrSize > 0) return attrSize;

  const style = getSvgAttr(attrs, 'style') || '';
  const styleMatch = style.match(/font-size\s*:\s*([\d.]+)/i);
  const styleSize = styleMatch ? parseFloat(styleMatch[1]) : NaN;
  return Number.isFinite(styleSize) && styleSize > 0 ? styleSize : 18;
}

function getTextLineCount(content) {
  const tspans = String(content || '').match(/<tspan\b[^>]*>/gi);
  return Math.max(1, tspans ? tspans.length : 1);
}

function estimateTextWidth(attrs, content, fontSize) {
  const x = parseFloat(getSvgAttr(attrs, 'x'));
  const anchor = String(getSvgAttr(attrs, 'text-anchor') || 'start').toLowerCase();
  const safeX = Number.isFinite(x) ? x : 64;
  const lines = extractPlainTextLines(content);
  const textWidth = Math.max(...lines.map(line => estimateLineWidth(line, fontSize)), fontSize * 2);

  let available = 1224 - safeX;
  if (anchor === 'middle') available = Math.min(safeX - 56, 1224 - safeX) * 2;
  if (anchor === 'end') available = safeX - 56;

  const maxWidth = Math.max(80, Math.floor(available));
  return clamp(Math.ceil(textWidth + 18), 48, maxWidth);
}

function estimateTextHeight(fontSize, lineCount) {
  return Math.ceil(Math.max(fontSize * 1.35 * Math.max(1, lineCount), 22));
}

function extractPlainTextLines(content) {
  const lines = [];
  String(content || '').replace(/<tspan\b[^>]*>([\s\S]*?)<\/tspan>/gi, (_, inner) => {
    lines.push(stripSvgTags(inner));
    return '';
  });
  if (lines.length === 0) lines.push(stripSvgTags(content));
  return lines.map(line => line.trim()).filter(Boolean).length > 0 ? lines : [''];
}

function stripSvgTags(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function estimateLineWidth(line, fontSize) {
  return Array.from(String(line || '')).reduce((sum, ch) => {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) return sum + fontSize;
    if (/\s/.test(ch)) return sum + fontSize * 0.32;
    if (/[A-Z0-9]/.test(ch)) return sum + fontSize * 0.62;
    return sum + fontSize * 0.54;
  }, 0);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateSVG(svg) {
  const errors = [];
  if (!/^<svg[\s>]/i.test(svg)) errors.push('缺少 <svg> 根节点');
  if (!/<\/svg>\s*$/i.test(svg)) errors.push('缺少 </svg> 结束标签');
  if (!/viewBox=["']0 0 1280 720["']/i.test(svg)) errors.push('viewBox 必须为 0 0 1280 720');
  if (!/width=["']1280["']/i.test(svg)) errors.push('width 必须为 1280');
  if (!/height=["']720["']/i.test(svg)) errors.push('height 必须为 720');

  const forbidden = [
    ['<style', '禁止使用 <style>'],
    ['class=', '禁止使用 class 属性'],
    ['<foreignObject', '禁止使用 foreignObject'],
    ['<image', '禁止使用 image，避免导出成图片型 PPT'],
    ['<defs', '禁止使用 defs'],
    ['<marker', '禁止使用 marker'],
    ['<mask', '禁止使用 mask'],
    ['<clipPath', '禁止使用 clipPath'],
    ['<filter', '禁止使用 filter'],
    ['<linearGradient', '禁止使用 linearGradient'],
    ['<radialGradient', '禁止使用 radialGradient'],
    ['<script', '禁止使用 script'],
    ['<iframe', '禁止使用 iframe'],
    ['rgba(', '禁止使用 rgba()'],
  ];

  const lower = svg.toLowerCase();
  for (const [needle, message] of forbidden) {
    if (lower.includes(needle.toLowerCase())) errors.push(message);
  }

  const textTags = svg.match(/<text\b[^>]*>/gi) || [];
  textTags.forEach((tag, index) => {
    if (!/\bdata-w=["'][^"']+["']/i.test(tag)) errors.push(`第 ${index + 1} 个 text 缺少 data-w`);
    if (!/\bdata-h=["'][^"']+["']/i.test(tag)) errors.push(`第 ${index + 1} 个 text 缺少 data-h`);
    if (!/\bfont-family=["'][^"']*Microsoft YaHei/i.test(tag) && !/\bfont-family=["'][^"']*Arial/i.test(tag)) {
      errors.push(`第 ${index + 1} 个 text 字体必须使用 Microsoft YaHei 或 Arial`);
    }
  });

  return [...new Set(errors)].slice(0, 12);
}

function svgToHtml(svg) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body { margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden; background: #fff; }
  svg { display: block; width: 1280px; height: 720px; }
</style>
</head>
<body>
${svg}
</body>
</html>`;
}

function htmlToSvg(html) {
  const match = String(html || '').match(/(<svg[\s\S]*<\/svg>)/i);
  return match ? match[1] : '';
}

module.exports = { renderPage, renderAllPages, modifyPage, svgToHtml };
