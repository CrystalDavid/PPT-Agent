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
  let svg = sanitizeSvg(extractSVG(text));
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

  svg = sanitizeSvg(extractSVG(repaired));
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
