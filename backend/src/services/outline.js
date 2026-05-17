/**
 * 第二阶段：大纲生成服务
 */

const { chatCompletion } = require('./ai');
const { OUTLINE_SYSTEM } = require('../prompts/outline');
const { safeParseJSON } = require('./jsonParser');

/**
 * 基于调研底稿生成 PPT 大纲
 */
async function generateOutline(session) {
  const brief = session.brief;
  if (!brief) throw new Error('调研底稿不存在，无法生成大纲');

  const result = await chatCompletion([
    { role: 'system', content: OUTLINE_SYSTEM },
    {
      role: 'user',
      content: `请基于以下调研底稿生成 PPT 大纲：\n\n${JSON.stringify(brief, null, 2)}`,
    },
  ], { temperature: 0.6, maxTokens: 3000 });

  const outline = safeParseJSON(result);
  session.outline = outline;
  session.stage = 'outline';
  return outline;
}

/**
 * 用户修改大纲后重新调整
 */
async function refineOutline(session, userFeedback) {
  const result = await chatCompletion([
    { role: 'system', content: OUTLINE_SYSTEM },
    {
      role: 'user',
      content: `调研底稿：\n${JSON.stringify(session.brief, null, 2)}\n\n当前大纲：\n${JSON.stringify(session.outline, null, 2)}\n\n用户反馈：${userFeedback}\n\n请根据用户反馈修改大纲，输出完整的新大纲 JSON。`,
    },
  ], { temperature: 0.6, maxTokens: 3000 });

  const outline = safeParseJSON(result);
  session.outline = outline;
  return outline;
}

module.exports = { generateOutline, refineOutline };
