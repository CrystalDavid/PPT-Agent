/**
 * 第三阶段：策划稿生成服务
 */

const { chatCompletion } = require('./ai');
const { PLANNING_SYSTEM } = require('../prompts/planning');
const { safeParseJSON } = require('./jsonParser');

const PLANNING_MAX_TOKENS = Number.parseInt(process.env.PLANNING_MAX_TOKENS || '16000', 10);
const PLANNING_AI_TIMEOUT_MS = Number.parseInt(process.env.PLANNING_AI_TIMEOUT_MS || '300000', 10);

/**
 * 基于大纲和底稿生成逐页策划稿
 */
async function generatePlanning(session) {
  const { brief, outline } = session;
  if (!outline) throw new Error('大纲不存在，无法生成策划稿');

  const messages = [
    { role: 'system', content: PLANNING_SYSTEM },
    {
      role: 'user',
      content: `调研底稿：\n${JSON.stringify(brief, null, 2)}\n\n已确认大纲：\n${JSON.stringify(outline, null, 2)}\n\n请为每一页生成策划卡片。`,
    },
  ];

  const result = await chatCompletion(messages, planningAiOptions());
  const planning = await parsePlanningOrRepair(result, messages);
  session.planning = planning;
  session.stage = 'planning';
  return planning;
}

/**
 * 用户修改某页策划后重新生成该页
 */
async function refinePlanningPage(session, pageNumber, userFeedback) {
  const { brief, outline, planning } = session;

  const messages = [
    { role: 'system', content: PLANNING_SYSTEM },
    {
      role: 'user',
      content: `调研底稿：\n${JSON.stringify(brief, null, 2)}\n\n大纲：\n${JSON.stringify(outline, null, 2)}\n\n当前策划稿：\n${JSON.stringify(planning, null, 2)}\n\n用户要求修改第 ${pageNumber} 页，反馈：${userFeedback}\n\n请输出修改后的完整策划稿 JSON。`,
    },
  ];

  const result = await chatCompletion(messages, planningAiOptions());
  const newPlanning = await parsePlanningOrRepair(result, messages);
  session.planning = newPlanning;
  return newPlanning;
}

/**
 * 整体修改策划稿
 */
async function refinePlanningAll(session, feedback) {
  const { brief, outline, planning } = session;

  const messages = [
    { role: 'system', content: PLANNING_SYSTEM },
    {
      role: 'user',
      content: `调研底稿：\n${JSON.stringify(brief, null, 2)}\n\n大纲：\n${JSON.stringify(outline, null, 2)}\n\n当前策划稿：\n${JSON.stringify(planning, null, 2)}\n\n用户要求整体修改：${feedback}\n\n请输出修改后的完整策划稿 JSON。`,
    },
  ];

  const result = await chatCompletion(messages, planningAiOptions());
  const newPlanning = await parsePlanningOrRepair(result, messages);
  session.planning = newPlanning;
  return newPlanning;
}

function planningAiOptions(overrides = {}) {
  return {
    temperature: 0.55,
    maxTokens: PLANNING_MAX_TOKENS,
    timeoutMs: PLANNING_AI_TIMEOUT_MS,
    retries: 4,
    ...overrides,
  };
}

async function parsePlanningOrRepair(text, originalMessages) {
  let parsed = safeParseJSON(text);
  if (isValidPlanning(parsed)) return parsed;

  const repaired = await chatCompletion([
    { role: 'system', content: PLANNING_SYSTEM },
    {
      role: 'user',
      content: `上一次输出不是合法的策划稿 JSON。请只输出一个完整 JSON，不要 Markdown，不要解释，不要省略任何页面。\n\n原始任务：\n${originalMessages[1]?.content || ''}\n\n上一次输出片段：\n${clipText(text, 8000)}`,
    },
  ], planningAiOptions({ temperature: 0.25, retries: 2 }));

  parsed = safeParseJSON(repaired);
  if (!isValidPlanning(parsed)) {
    throw new Error('策划稿 JSON 格式异常，AI 未返回完整 planning_draft.pages');
  }
  return parsed;
}

function isValidPlanning(value) {
  const draft = value?.planning_draft || value;
  return !!draft && Array.isArray(draft.pages) && draft.pages.length > 0 && !value.raw;
}

function clipText(value, maxLength) {
  const text = String(value || '');
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n...` : text;
}

module.exports = { generatePlanning, refinePlanningPage, refinePlanningAll };
