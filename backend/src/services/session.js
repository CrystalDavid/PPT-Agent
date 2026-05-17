/**
 * 内存会话管理
 * 生产环境应替换为 Redis 或数据库
 */

const sessions = new Map();

function createSession(id) {
  const session = {
    id,
    stage: 'interview',        // interview | outline | planning | render | export
    interviewStep: 0,          // 0=初始, 1=场景锁定, 2=亮点挖掘, 3=边界确认, 4=底稿生成
    topic: '',
    messages: [],              // 完整对话历史
    context: {                 // 访谈过程中收集的结构化信息
      topic: '',
      audience: '',
      purpose: '',
      scene: '',
      highlights: '',
      timeLimit: '',
      pageCount: '',
      materials: '',
      broadSearch: '',         // 第一轮搜索结果
      deepSearch: '',          // 第二轮搜索结果
    },
    brief: null,               // 最终生成的调研底稿
    outline: null,
    planning: null,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id);
}

function updateSession(id, updates) {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates);
  return session;
}

module.exports = { createSession, getSession, updateSession };
