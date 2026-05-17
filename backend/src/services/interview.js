/**
 * 访谈阶段核心逻辑
 * 实现步骤 1.0 ~ 1.5 的搜索-追问循环
 */

const { chatCompletion } = require('./ai');
const {
  BROAD_SEARCH_SYSTEM,
  INTERVIEW_ROUND1_SYSTEM,
  DEEP_SEARCH_SYSTEM,
  INTERVIEW_ROUND2_SYSTEM,
  INTERVIEW_ROUND3_SYSTEM,
  RESEARCH_BRIEF_SYSTEM,
} = require('../prompts/interview');

/**
 * 步骤 1.0：广度搜索 — 建立行业直觉
 */
async function broadSearch(topic) {
  const result = await chatCompletion([
    { role: 'system', content: BROAD_SEARCH_SYSTEM },
    { role: 'user', content: `主题：${topic}` },
  ], { temperature: 0.5, maxTokens: 1024 });
  return safeParseJSON(result);
}

/**
 * 步骤 1.1：第一轮追问 — 锁定场景与受众
 */
async function interviewRound1(topic, broadContext) {
  const result = await chatCompletion([
    { role: 'system', content: INTERVIEW_ROUND1_SYSTEM },
    {
      role: 'user',
      content: `用户的主题是：「${topic}」\n\n初步调研结果：\n${JSON.stringify(broadContext, null, 2)}\n\n请基于以上信息，向用户发起第一轮提问。`,
    },
  ], { temperature: 0.8, maxTokens: 1500 });
  return result;
}

/**
 * 步骤 1.2：深度搜索 — 提取框架与核心内容
 */
async function deepSearch(topic, scene, audience) {
  const result = await chatCompletion([
    { role: 'system', content: DEEP_SEARCH_SYSTEM },
    {
      role: 'user',
      content: `主题：${topic}\n场景：${scene}\n受众：${audience}`,
    },
  ], { temperature: 0.5, maxTokens: 1536 });
  return safeParseJSON(result);
}

/**
 * 步骤 1.3：第二轮追问 — 挖掘核心亮点
 */
async function interviewRound2(session) {
  const { topic, context } = session;
  const result = await chatCompletion([
    { role: 'system', content: INTERVIEW_ROUND2_SYSTEM },
    {
      role: 'user',
      content: `主题：${topic}\n场景：${context.scene}\n受众：${context.audience}\n\n深度调研结果：\n${JSON.stringify(context.deepSearch, null, 2)}\n\n请基于以上信息，帮用户梳理核心亮点方向。`,
    },
  ], { temperature: 0.8, maxTokens: 1500 });
  return result;
}

/**
 * 步骤 1.4：第三轮追问 — 框定边界与约束
 */
async function interviewRound3(session) {
  const { topic, context } = session;
  const result = await chatCompletion([
    { role: 'system', content: INTERVIEW_ROUND3_SYSTEM },
    {
      role: 'user',
      content: `主题：${topic}\n场景：${context.scene}\n受众：${context.audience}\n核心亮点：${context.highlights}\n\n请进行最后一轮确认。`,
    },
  ], { temperature: 0.7, maxTokens: 1500 });
  return result;
}

/**
 * 步骤 1.5：生成调研底稿 (Research Brief)
 */
async function generateBrief(session) {
  const { messages, context } = session;

  // 构建访谈摘要
  const interviewSummary = `
主题：${context.topic}
场景：${context.scene}
受众：${context.audience}
核心亮点：${context.highlights}
时间限制：${context.timeLimit}
页数要求：${context.pageCount}
手头素材：${context.materials}
广度调研：${JSON.stringify(context.broadSearch, null, 2)}
深度调研：${JSON.stringify(context.deepSearch, null, 2)}

完整对话记录：
${messages.map((m) => `[${m.role}]: ${m.content}`).join('\n')}
`.trim();

  const result = await chatCompletion([
    { role: 'system', content: RESEARCH_BRIEF_SYSTEM },
    { role: 'user', content: interviewSummary },
  ], { temperature: 0.4, maxTokens: 2048 });

  return safeParseJSON(result);
}

/**
 * 主调度：根据当前 interviewStep 决定下一步动作
 */
async function handleInterviewMessage(session, userMessage) {
  const step = session.interviewStep;

  switch (step) {
    case 0: {
      // 用户刚输入主题 → 执行广度搜索 + 生成第一轮追问
      session.context.topic = userMessage;
      session.topic = userMessage;

      const broadResult = await broadSearch(userMessage);
      session.context.broadSearch = broadResult;

      const question = await interviewRound1(userMessage, broadResult);
      session.interviewStep = 1;
      return { reply: question, action: 'ask', step: 1 };
    }

    case 1: {
      // 用户回答了场景/受众 → 执行深度搜索 + 生成第二轮追问
      session.context.scene = userMessage;
      session.context.audience = userMessage; // 从回答中提取

      const deepResult = await deepSearch(
        session.topic,
        session.context.scene,
        session.context.audience
      );
      session.context.deepSearch = deepResult;

      const question = await interviewRound2(session);
      session.interviewStep = 2;
      return { reply: question, action: 'ask', step: 2 };
    }

    case 2: {
      // 用户回答了核心亮点 → 生成第三轮追问
      session.context.highlights = userMessage;

      const question = await interviewRound3(session);
      session.interviewStep = 3;
      return { reply: question, action: 'ask', step: 3 };
    }

    case 3: {
      // 用户回答了边界约束 → 解析并生成底稿
      parseConstraints(session, userMessage);

      const brief = await generateBrief(session);
      session.brief = brief;
      session.interviewStep = 4;
      session.stage = 'outline'; // 准备进入下一阶段

      return {
        reply: '调研底稿已生成，请确认后进入大纲生成阶段。',
        action: 'brief_ready',
        step: 4,
        brief,
      };
    }

    default:
      return { reply: '访谈阶段已完成，请进入大纲生成。', action: 'done', step: 4 };
  }
}

// ---- 工具函数 ----

const { safeParseJSON } = require('./jsonParser');

function parseConstraints(session, message) {
  // 简单提取，后续可用 AI 做结构化解析
  session.context.timeLimit = message;
  session.context.pageCount = message;
  session.context.materials = message;
}

module.exports = { handleInterviewMessage, broadSearch, deepSearch, generateBrief };
