/**
 * 调研底稿修改服务
 */

const { chatCompletion } = require('./ai');
const { RESEARCH_BRIEF_SYSTEM } = require('../prompts/interview');
const { safeParseJSON } = require('./jsonParser');

/**
 * 根据用户反馈修改调研底稿
 */
async function refineBrief(session, feedback) {
  const result = await chatCompletion([
    { role: 'system', content: RESEARCH_BRIEF_SYSTEM },
    {
      role: 'user',
      content: `当前调研底稿：\n${JSON.stringify(session.brief, null, 2)}\n\n用户要求修改：${feedback}\n\n请根据用户反馈修改底稿，输出完整的新底稿 JSON。保留用户没有提到要修改的部分，只调整用户明确要求修改的内容。`,
    },
  ], { temperature: 0.5, maxTokens: 2048 });

  const brief = safeParseJSON(result);
  session.brief = brief;
  return brief;
}

module.exports = { refineBrief };
