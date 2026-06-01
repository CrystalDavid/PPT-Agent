/**
 * 前端 API 调用封装
 * 所有请求直接调用后端，绕过 Next.js 代理（避免代理超时导致数据丢失）
 */

export const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:3001').replace(/\/$/, '');
const API = (process.env.NEXT_PUBLIC_WORKFLOW_API || `${BACKEND_ORIGIN}/api/workflow`).replace(/\/$/, '');

/**
 * 带重试的 fetch 封装
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await globalThis.fetch(url, options);
      return res;
    } catch (err) {
      if (attempt < retries) {
        const delay = Math.min(3000 * Math.pow(2, attempt), 15000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('请求失败');
}

export interface ChatResponse {
  sessionId: string;
  stage: string;
  interviewStep: number;
  reply: string;
  action: string;
  brief: Record<string, unknown> | null;
}

export interface BriefResponse {
  sessionId: string;
  brief: Record<string, unknown>;
}

export interface OutlineResponse {
  sessionId: string;
  stage: string;
  outline: Record<string, unknown>;
}

export interface PlanningResponse {
  sessionId: string;
  stage: string;
  planning: Record<string, unknown>;
}

export interface RenderedPage {
  page_number: number;
  title: string;
  svg?: string;
  html: string;
}

export interface RenderResponse {
  sessionId: string;
  stage: string;
  pages: RenderedPage[];
}

export interface ExportResponse {
  sessionId: string;
  filename: string;
  downloadUrl: string;
}

export interface SessionState {
  id: string;
  stage?: string;
  interviewStep?: number;
  topic?: string;
  messages?: unknown[];
  context?: Record<string, unknown>;
  brief?: Record<string, unknown> | null;
  outline?: Record<string, unknown> | null;
  planning?: Record<string, unknown> | null;
  renderedPages?: RenderedPage[];
  createdAt?: number;
  importedAt?: number | null;
}

export interface SessionImportResponse {
  sessionId: string;
  stage: string;
  session: SessionState;
}

export async function sendMessage(sessionId: string | null, message: string): Promise<ChatResponse> {
  const res = await fetchWithRetry(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function refineBrief(sessionId: string, feedback: string): Promise<BriefResponse> {
  const res = await fetchWithRetry(`${API}/brief/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, feedback }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function generateOutline(sessionId: string): Promise<OutlineResponse> {
  const res = await fetchWithRetry(`${API}/outline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function refineOutline(sessionId: string, feedback: string): Promise<OutlineResponse> {
  const res = await fetchWithRetry(`${API}/outline/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, feedback }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function generatePlanningDraft(sessionId: string): Promise<PlanningResponse> {
  const res = await fetchWithRetry(`${API}/planning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function refinePlanningPage(sessionId: string, pageNumber: number, feedback: string): Promise<PlanningResponse> {
  const res = await fetchWithRetry(`${API}/planning/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, pageNumber, feedback }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function refinePlanningAll(sessionId: string, feedback: string): Promise<PlanningResponse> {
  const res = await fetchWithRetry(`${API}/planning/refine-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, feedback }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function renderAllPages(sessionId: string): Promise<RenderResponse> {
  // 直接调用后端，绕过 Next.js 代理（避免代理超时）
  const res = await fetchWithRetry(`${API}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function renderSinglePage(sessionId: string, pageNumber: number): Promise<{ svg?: string; html: string }> {
  const res = await fetchWithRetry(`${API}/render/page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, pageNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function modifyRenderedPage(sessionId: string, pageNumber: number, instruction: string): Promise<{ svg?: string; html: string }> {
  const res = await fetchWithRetry(`${API}/render/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, pageNumber, instruction }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function exportHtml(sessionId: string): Promise<ExportResponse> {
  const res = await fetchWithRetry(`${API}/export/html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function exportPdf(sessionId: string): Promise<ExportResponse> {
  const res = await fetchWithRetry(`${API}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function exportPptx(sessionId: string): Promise<ExportResponse> {
  const res = await fetchWithRetry(`${API}/export/pptx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function exportSession(sessionId: string): Promise<ExportResponse> {
  const res = await fetchWithRetry(`${API}/session/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function importSessionFile(payload: unknown): Promise<SessionImportResponse> {
  const res = await fetchWithRetry(`${API}/session/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
