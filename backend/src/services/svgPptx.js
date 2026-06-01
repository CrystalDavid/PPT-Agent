/**
 * SVG -> DrawingML PPTX exporter.
 *
 * This intentionally supports the strict SVG subset produced by render.js:
 * rect / circle / ellipse / line / text / tspan. The goal is editable native
 * PowerPoint output, not screenshot fidelity.
 */

const cheerio = require('cheerio');
const PptxGenJS = require('pptxgenjs');

const CANVAS_W = 1280;
const CANVAS_H = 720;
const SLIDE_W = 13.333333;
const SLIDE_H = 7.5;

const NAMED_COLORS = {
  black: '000000',
  white: 'FFFFFF',
  transparent: null,
  none: null,
  red: 'FF0000',
  blue: '0000FF',
  green: '008000',
  gray: '808080',
  grey: '808080',
};

async function exportSvgPagesToPptx(pages, outputPath) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'PPT Agent';
  pptx.company = 'PPT Agent';
  pptx.subject = 'Editable SVG-generated presentation';
  pptx.title = 'PPT Agent Presentation';
  pptx.lang = 'zh-CN';
  pptx.theme = {
    headFontFace: 'Microsoft YaHei',
    bodyFontFace: 'Microsoft YaHei',
    lang: 'zh-CN',
  };
  pptx.defineLayout({ name: 'PPT_AGENT_WIDE', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'PPT_AGENT_WIDE';

  for (const page of pages) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    renderSvgOnSlide(slide, pptx, page.svg);
  }

  await pptx.writeFile({ fileName: outputPath });
}

function renderSvgOnSlide(slide, pptx, svg) {
  const $ = cheerio.load(svg, { xmlMode: true, decodeEntities: true });
  const root = $('svg').first();
  if (!root.length) throw new Error('SVG 根节点不存在');

  root.children().each((_, node) => {
    renderNode($, slide, pptx, node, {
      ox: 0,
      oy: 0,
      opacity: 1,
      fill: null,
      stroke: null,
      fontFamily: 'Microsoft YaHei',
      fontSize: 18,
      fontWeight: '400',
    });
  });
}

function renderNode($, slide, pptx, node, state) {
  if (!node || node.type !== 'tag') return;
  const tag = (node.name || node.tagName || '').toLowerCase();
  const el = $(node);

  if (tag === 'defs' || tag === 'title' || tag === 'desc') return;

  if (tag === 'g' || tag === 'svg') {
    const nextState = inheritState(el, state);
    el.children().each((_, child) => renderNode($, slide, pptx, child, nextState));
    return;
  }

  if (tag === 'rect') return renderRect(el, slide, pptx, state);
  if (tag === 'circle') return renderCircle(el, slide, pptx, state);
  if (tag === 'ellipse') return renderEllipse(el, slide, pptx, state);
  if (tag === 'line') return renderLine(el, slide, pptx, state);
  if (tag === 'path') return renderPath(el, slide, pptx, state);
  if (tag === 'polygon' || tag === 'polyline') return renderPolygon(el, slide, pptx, state, tag === 'polygon');
  if (tag === 'text') return renderText($, el, slide, state);
}

function inheritState(el, state) {
  const style = parseStyle(el.attr('style'));
  const [tx, ty] = parseTranslate(el.attr('transform'));
  return {
    ...state,
    ox: state.ox + tx,
    oy: state.oy + ty,
    opacity: state.opacity * readOpacity(el, style, 'opacity', 1),
    fill: readPaint(el, style, 'fill', state.fill),
    stroke: readPaint(el, style, 'stroke', state.stroke),
    fontFamily: cleanFont(readValue(el, style, 'font-family', state.fontFamily)),
    fontSize: num(readValue(el, style, 'font-size', state.fontSize), state.fontSize),
    fontWeight: readValue(el, style, 'font-weight', state.fontWeight),
  };
}

function renderRect(el, slide, pptx, state) {
  const style = parseStyle(el.attr('style'));
  const x = num(el.attr('x'), 0) + state.ox;
  const y = num(el.attr('y'), 0) + state.oy;
  const w = num(el.attr('width'), 0);
  const h = num(el.attr('height'), 0);
  if (w <= 0 || h <= 0) return;

  const rx = Math.max(num(el.attr('rx'), 0), num(el.attr('ry'), 0));
  const fill = fillOptions(readPaint(el, style, 'fill', state.fill || '#FFFFFF'), state.opacity * readOpacity(el, style, 'fill-opacity', 1));
  const line = lineOptions(el, style, state);

  slide.addShape(rx > 0 ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x: pxX(x),
    y: pxY(y),
    w: pxX(w),
    h: pxY(h),
    rectRadius: rx > 0 ? Math.min(pxX(rx) / Math.max(pxX(w), 0.01), 0.18) : undefined,
    fill,
    line,
  });
}

function renderCircle(el, slide, pptx, state) {
  const style = parseStyle(el.attr('style'));
  const r = num(el.attr('r'), 0);
  if (r <= 0) return;
  const cx = num(el.attr('cx'), 0) + state.ox;
  const cy = num(el.attr('cy'), 0) + state.oy;
  slide.addShape(pptx.ShapeType.ellipse, {
    x: pxX(cx - r),
    y: pxY(cy - r),
    w: pxX(r * 2),
    h: pxY(r * 2),
    fill: fillOptions(readPaint(el, style, 'fill', state.fill || '#FFFFFF'), state.opacity * readOpacity(el, style, 'fill-opacity', 1)),
    line: lineOptions(el, style, state),
  });
}

function renderEllipse(el, slide, pptx, state) {
  const style = parseStyle(el.attr('style'));
  const rx = num(el.attr('rx'), 0);
  const ry = num(el.attr('ry'), 0);
  if (rx <= 0 || ry <= 0) return;
  const cx = num(el.attr('cx'), 0) + state.ox;
  const cy = num(el.attr('cy'), 0) + state.oy;
  slide.addShape(pptx.ShapeType.ellipse, {
    x: pxX(cx - rx),
    y: pxY(cy - ry),
    w: pxX(rx * 2),
    h: pxY(ry * 2),
    fill: fillOptions(readPaint(el, style, 'fill', state.fill || '#FFFFFF'), state.opacity * readOpacity(el, style, 'fill-opacity', 1)),
    line: lineOptions(el, style, state),
  });
}

function renderLine(el, slide, pptx, state) {
  const style = parseStyle(el.attr('style'));
  const x1 = num(el.attr('x1'), 0) + state.ox;
  const y1 = num(el.attr('y1'), 0) + state.oy;
  const x2 = num(el.attr('x2'), 0) + state.ox;
  const y2 = num(el.attr('y2'), 0) + state.oy;
  slide.addShape(pptx.ShapeType.line, {
    x: pxX(x1),
    y: pxY(y1),
    w: pxX(x2 - x1),
    h: pxY(y2 - y1),
    line: lineOptions(el, style, state, '#CBD5E1'),
  });
}

function renderPath(el, slide, pptx, state) {
  const style = parseStyle(el.attr('style'));
  const commands = parsePathData(el.attr('d'));
  if (commands.length < 2) return;
  renderCustomGeometry(slide, pptx, commands, el, style, state);
}

function renderPolygon(el, slide, pptx, state, closed) {
  const style = parseStyle(el.attr('style'));
  const rawPoints = String(el.attr('points') || '').trim();
  if (!rawPoints) return;
  const pairs = rawPoints
    .replace(/,/g, ' ')
    .trim()
    .split(/\s+/)
    .map(Number);
  const points = [];
  for (let i = 0; i < pairs.length - 1; i += 2) {
    if (Number.isFinite(pairs[i]) && Number.isFinite(pairs[i + 1])) {
      points.push({ x: pairs[i], y: pairs[i + 1], moveTo: points.length === 0 });
    }
  }
  if (closed && points.length > 2) points.push({ close: true });
  if (points.length < 2) return;
  renderCustomGeometry(slide, pptx, points, el, style, state);
}

function renderCustomGeometry(slide, pptx, commands, el, style, state) {
  const rawPoints = commands.flatMap((cmd) => {
    if (cmd.close) return [];
    const pts = [{ x: cmd.x, y: cmd.y }];
    if (cmd.curve?.x1 != null) pts.push({ x: cmd.curve.x1, y: cmd.curve.y1 });
    if (cmd.curve?.x2 != null) pts.push({ x: cmd.curve.x2, y: cmd.curve.y2 });
    return pts;
  });
  if (!rawPoints.length) return;

  const xs = rawPoints.map(p => p.x + state.ox);
  const ys = rawPoints.map(p => p.y + state.oy);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const wPx = Math.max(1, maxX - minX);
  const hPx = Math.max(1, maxY - minY);

  const localPoints = commands.map((cmd) => {
    if (cmd.close) return { close: true };
    const out = {
      x: pxX(cmd.x + state.ox - minX),
      y: pxY(cmd.y + state.oy - minY),
    };
    if (cmd.moveTo) out.moveTo = true;
    if (cmd.curve) {
      out.curve = { ...cmd.curve };
      if (out.curve.x1 != null) out.curve.x1 = pxX(out.curve.x1 + state.ox - minX);
      if (out.curve.y1 != null) out.curve.y1 = pxY(out.curve.y1 + state.oy - minY);
      if (out.curve.x2 != null) out.curve.x2 = pxX(out.curve.x2 + state.ox - minX);
      if (out.curve.y2 != null) out.curve.y2 = pxY(out.curve.y2 + state.oy - minY);
    }
    return out;
  });

  slide.addShape(pptx.ShapeType.custGeom, {
    x: pxX(minX),
    y: pxY(minY),
    w: pxX(wPx),
    h: pxY(hPx),
    points: localPoints,
    fill: fillOptions(readPaint(el, style, 'fill', 'none'), state.opacity * readOpacity(el, style, 'fill-opacity', 1)),
    line: lineOptions(el, style, state, '#CBD5E1'),
  });
}

function renderText($, el, slide, state) {
  const style = parseStyle(el.attr('style'));
  const base = textOptions(el, style, state);
  const tspans = el.children('tspan').toArray();

  if (tspans.length > 0) {
    let cursorY = base.baselineY;
    tspans.forEach((node, index) => {
      const tspan = $(node);
      const tStyle = parseStyle(tspan.attr('style'));
      const text = normalizeText(tspan.text());
      if (!text) return;

      const dy = tspan.attr('dy');
      if (tspan.attr('y') != null) cursorY = num(tspan.attr('y'), cursorY);
      else if (dy != null) cursorY += parseDy(dy, base.fontPx);
      else if (index > 0) cursorY += base.fontPx * 1.24;

      const x = num(tspan.attr('x'), base.xPx) + state.ox;
      const childBase = {
        ...base,
        xPx: x,
        baselineY: cursorY + state.oy,
        fontPx: num(readValue(tspan, tStyle, 'font-size', base.fontPx), base.fontPx),
        fontFamily: cleanFont(readValue(tspan, tStyle, 'font-family', base.fontFamily)),
        fontWeight: readValue(tspan, tStyle, 'font-weight', base.fontWeight),
        color: colorToHex(readPaint(tspan, tStyle, 'fill', `#${base.color}`)) || base.color,
      };
      addTextBox(slide, text, childBase);
    });
    return;
  }

  const text = normalizeText(el.text());
  if (!text) return;
  addTextBox(slide, text, base);
}

function parsePathData(d) {
  const tokens = String(d || '').match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g) || [];
  const points = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;

  const isCmd = (v) => /^[a-zA-Z]$/.test(v || '');
  const nextNum = () => num(tokens[i++], 0);

  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++];
    if (!cmd) break;
    const relative = cmd === cmd.toLowerCase();
    const op = cmd.toUpperCase();

    if (op === 'M') {
      x = nextNum(); y = nextNum();
      if (relative && points.length) { x += points[points.length - 1].x; y += points[points.length - 1].y; }
      points.push({ x, y, moveTo: true });
      sx = x; sy = y;
      cmd = relative ? 'l' : 'L';
      continue;
    }
    if (op === 'L') {
      x = nextNum(); y = nextNum();
      if (relative) { x += currentX(points); y += currentY(points); }
      points.push({ x, y });
      continue;
    }
    if (op === 'H') {
      x = nextNum();
      if (relative) x += currentX(points);
      y = currentY(points);
      points.push({ x, y });
      continue;
    }
    if (op === 'V') {
      y = nextNum();
      if (relative) y += currentY(points);
      x = currentX(points);
      points.push({ x, y });
      continue;
    }
    if (op === 'C') {
      let x1 = nextNum(), y1 = nextNum(), x2 = nextNum(), y2 = nextNum(), ex = nextNum(), ey = nextNum();
      const cx = currentX(points), cy = currentY(points);
      if (relative) { x1 += cx; y1 += cy; x2 += cx; y2 += cy; ex += cx; ey += cy; }
      points.push({ x: ex, y: ey, curve: { type: 'cubic', x1, y1, x2, y2 } });
      continue;
    }
    if (op === 'Q') {
      let x1 = nextNum(), y1 = nextNum(), ex = nextNum(), ey = nextNum();
      const cx = currentX(points), cy = currentY(points);
      if (relative) { x1 += cx; y1 += cy; ex += cx; ey += cy; }
      points.push({ x: ex, y: ey, curve: { type: 'quadratic', x1, y1 } });
      continue;
    }
    if (op === 'Z') {
      points.push({ close: true });
      x = sx; y = sy;
      continue;
    }

    break;
  }
  return points;
}

function currentX(points) {
  for (let i = points.length - 1; i >= 0; i--) if (!points[i].close) return points[i].x;
  return 0;
}

function currentY(points) {
  for (let i = points.length - 1; i >= 0; i--) if (!points[i].close) return points[i].y;
  return 0;
}

function textOptions(el, style, state) {
  const fontPx = num(readValue(el, style, 'font-size', state.fontSize), state.fontSize);
  const dataW = num(el.attr('data-w'), 260);
  const dataH = num(el.attr('data-h'), Math.max(fontPx * 1.35, 22));
  const anchor = String(readValue(el, style, 'text-anchor', 'start')).toLowerCase();
  const dominant = String(readValue(el, style, 'dominant-baseline', 'auto')).toLowerCase();

  let xPx = num(el.attr('x'), 0) + state.ox;
  let baselineY = num(el.attr('y'), 0) + state.oy;
  if (anchor === 'middle') xPx -= dataW / 2;
  else if (anchor === 'end') xPx -= dataW;
  if (dominant === 'middle' || dominant === 'central') baselineY += dataH / 2 - fontPx * 0.36;

  const fill = readPaint(el, style, 'fill', state.fill || '#111827');
  return {
    xPx,
    baselineY,
    wPx: dataW,
    hPx: dataH,
    fontPx,
    fontFamily: cleanFont(readValue(el, style, 'font-family', state.fontFamily)),
    fontWeight: readValue(el, style, 'font-weight', state.fontWeight),
    color: colorToHex(fill) || '111827',
    opacity: state.opacity * readOpacity(el, style, 'fill-opacity', 1),
    align: anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left',
  };
}

function addTextBox(slide, text, base) {
  const yTop = base.baselineY - base.fontPx * 0.84;
  slide.addText(text, {
    x: pxX(base.xPx),
    y: pxY(yTop),
    w: pxX(base.wPx),
    h: pxY(base.hPx),
    fontFace: base.fontFamily,
    fontSize: pxFontToPt(base.fontPx),
    bold: isBold(base.fontWeight),
    color: base.color,
    transparency: transparency(base.opacity),
    margin: 0,
    fit: 'shrink',
    breakLine: false,
    valign: 'top',
    align: base.align || 'left',
  });
}

function parseStyle(style) {
  const out = {};
  String(style || '').split(';').forEach((chunk) => {
    const idx = chunk.indexOf(':');
    if (idx === -1) return;
    const key = chunk.slice(0, idx).trim().toLowerCase();
    const value = chunk.slice(idx + 1).trim();
    if (key) out[key] = value;
  });
  return out;
}

function parseTranslate(transform) {
  const match = String(transform || '').match(/translate\(\s*([-.\d]+)(?:[,\s]+([-.\d]+))?\s*\)/i);
  if (!match) return [0, 0];
  return [num(match[1], 0), num(match[2], 0)];
}

function parseDy(value, fontPx) {
  const raw = String(value || '').trim();
  if (raw.endsWith('em')) return num(raw, 0) * fontPx;
  return num(raw, 0);
}

function readValue(el, style, key, fallback) {
  return el.attr(key) ?? style[key] ?? fallback;
}

function readPaint(el, style, key, fallback) {
  return readValue(el, style, key, fallback);
}

function readOpacity(el, style, key, fallback) {
  return clamp(num(readValue(el, style, key, fallback), fallback), 0, 1);
}

function lineOptions(el, style, state, fallbackStroke = null) {
  const stroke = readPaint(el, style, 'stroke', state.stroke || fallbackStroke);
  const color = colorToHex(stroke);
  const widthPx = num(readValue(el, style, 'stroke-width', 1), 1);
  if (!color || widthPx <= 0) {
    return { color: 'FFFFFF', transparency: 100, width: 0 };
  }
  const opacity = state.opacity * readOpacity(el, style, 'stroke-opacity', 1);
  return {
    color,
    transparency: transparency(opacity),
    width: Math.max(0.25, pxFontToPt(widthPx)),
  };
}

function fillOptions(fill, opacity) {
  const color = colorToHex(fill);
  if (!color) return { color: 'FFFFFF', transparency: 100 };
  return { color, transparency: transparency(opacity) };
}

function colorToHex(value) {
  if (value == null) return null;
  const raw = String(value).trim().replace(/["']/g, '');
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(NAMED_COLORS, lower)) return NAMED_COLORS[lower];

  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return raw.slice(1).split('').map(ch => ch + ch).join('').toUpperCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.slice(1).toUpperCase();

  const rgb = raw.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]]
      .map(v => Math.max(0, Math.min(255, Number(v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }
  return null;
}

function cleanFont(value) {
  const raw = String(value || 'Microsoft YaHei').replace(/["']/g, '');
  const first = raw.split(',')[0].trim();
  if (/arial/i.test(first)) return 'Arial';
  if (/yahei|微软雅黑|microsoft/i.test(first)) return 'Microsoft YaHei';
  return first || 'Microsoft YaHei';
}

function normalizeText(value) {
  return decodeXmlEntities(String(value || ''))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function isBold(value) {
  const raw = String(value || '').toLowerCase();
  return raw === 'bold' || Number(raw) >= 600;
}

function num(value, fallback) {
  if (value == null || value === '') return fallback;
  const parsed = parseFloat(String(value).replace('px', ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function transparency(opacity) {
  return Math.round((1 - clamp(opacity, 0, 1)) * 100);
}

function pxX(value) {
  return value / CANVAS_W * SLIDE_W;
}

function pxY(value) {
  return value / CANVAS_H * SLIDE_H;
}

function pxFontToPt(value) {
  return Math.max(5, value * 0.75);
}

module.exports = { exportSvgPagesToPptx };
