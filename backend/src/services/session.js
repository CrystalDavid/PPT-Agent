/**
 * In-memory session storage.
 * Production deployments can replace this with Redis or a database.
 */

const sessions = new Map();

function createBaseSession(id) {
  return {
    id,
    stage: 'interview',
    interviewStep: 0,
    topic: '',
    messages: [],
    context: {
      topic: '',
      audience: '',
      purpose: '',
      scene: '',
      highlights: '',
      timeLimit: '',
      pageCount: '',
      materials: '',
      broadSearch: '',
      deepSearch: '',
    },
    brief: null,
    outline: null,
    planning: null,
    renderedPages: [],
    createdAt: Date.now(),
  };
}

function createSession(id) {
  const session = createBaseSession(id);
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

function serializeSession(session) {
  return {
    id: session.id,
    stage: session.stage || 'interview',
    interviewStep: Number.isFinite(session.interviewStep) ? session.interviewStep : 0,
    topic: session.topic || '',
    messages: Array.isArray(session.messages) ? session.messages : [],
    context: session.context && typeof session.context === 'object' ? session.context : {},
    brief: session.brief || null,
    outline: session.outline || null,
    planning: session.planning || null,
    renderedPages: Array.isArray(session.renderedPages) ? session.renderedPages : [],
    createdAt: session.createdAt || Date.now(),
    importedAt: session.importedAt || null,
  };
}

function importSession(id, snapshot) {
  const source = snapshot?.session || snapshot || {};
  const base = createBaseSession(id);
  const session = {
    ...base,
    stage: normalizeStage(source.stage),
    interviewStep: Number.isFinite(source.interviewStep) ? source.interviewStep : base.interviewStep,
    topic: typeof source.topic === 'string' ? source.topic : base.topic,
    messages: Array.isArray(source.messages) ? source.messages : base.messages,
    context: source.context && typeof source.context === 'object' ? source.context : base.context,
    brief: source.brief || null,
    outline: source.outline || null,
    planning: source.planning || null,
    renderedPages: Array.isArray(source.renderedPages) ? source.renderedPages : base.renderedPages,
    createdAt: source.createdAt || base.createdAt,
    importedAt: Date.now(),
  };

  sessions.set(id, session);
  return session;
}

function normalizeStage(stage) {
  const allowed = new Set(['interview', 'brief', 'outline', 'planning', 'render', 'export']);
  return allowed.has(stage) ? stage : 'interview';
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  serializeSession,
  importSession,
};
