/**
 * 第三阶段：策划稿生成服务
 */

const { chatCompletion } = require('./ai');
const { PLANNING_SYSTEM } = require('../prompts/planning');
const { safeParseJSON } = require('./jsonParser');

/**
 * 基于大纲和底稿生成逐页策划稿
 */
async function generatePlanning(session) {
  const { brief, outline } = session;
  if (!outline) throw new Error('大纲不存在，无法生成策划稿');

  const result = await chatCompletion([
    { role: 'system', content: PLANNING_SYSTEM },
    {
      role: 'user',
      content: `调研底稿：\n${JSON.stringify(brief, null, 2)}\n\n已确认大纲：\n${JSON.stringify(outline, null, 2)}\n\n请为每一页生成策划卡片。`,
    },
  ], { temperature: 0.6, maxTokens: 4000 });

  const planning = safeParseJSON(result);
  session.planning = planning;
  session.stage = 'planning';
  return planning;
}

/**
 * 用户修改某页策划后重新生成该页
 */
async function refinePlanningPage(session, pageNumber, userFeedback) {
  const { brief, outline, planning } = session;

  const result = await chatCompletion([
    { role: 'system', content: PLANNING_SYSTEM },
    {
      role: 'user',
      content: `调研底稿：\n${JSON.stringify(brief, null, 2)}\n\n大纲：\n${JSON.stringify(outline, null, 2)}\n\n当前策划稿：\n${JSON.stringify(planning, null, 2)}\n\n用户要求修改第 ${pageNumber} 页，反馈：${userFeedback}\n\n请输出修改后的完整策划稿 JSON。`,
    },
  ], { temperature: 0.6, maxTokens: 4000 });

  const newPlanning = safeParseJSON(result);
  session.planning = newPlanning;
  return newPlanning;
}

/**
 * 整体修改策划稿
 */
async function refinePlanningAll(session, feedback) {
  const { brief, outline, planning } = session;

  const result = await chatCompletion([
    { role: 'system', content: PLANNING_SYSTEM },
    {
      role: 'user',
      content: `调研底稿：\n${JSON.stringify(brief, null, 2)}\n\n大纲：\n${JSON.stringify(outline, null, 2)}\n\n当前策划稿：\n${JSON.stringify(planning, null, 2)}\n\n用户要求整体修改：${feedback}\n\n请输出修改后的完整策划稿 JSON。`,
    },
  ], { temperature: 0.6, maxTokens: 4000 });

  const newPlanning = safeParseJSON(result);
  session.planning = newPlanning;
  return newPlanning;
}

module.exports = { generatePlanning, refinePlanningPage, refinePlanningAll };
