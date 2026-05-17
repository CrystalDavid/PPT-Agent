/**
 * 前端 API 调用封装
 */

const API_BASE = '/api/workflow';

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

export async function sendMessage(sessionId: string | null, message: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
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
  const res = await fetch(`${API_BASE}/brief/refine`, {
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
  const res = await fetch(`${API_BASE}/outline`, {
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
  const res = await fetch(`${API_BASE}/outline/refine`, {
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
  const res = await fetch(`${API_BASE}/planning`, {
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
  const res = await fetch(`${API_BASE}/planning/refine`, {
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
  const res = await fetch(`${API_BASE}/planning/refine-all`, {
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
  const res = await fetch(`http://localhost:3001/api/workflow/render`, {
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

export async function renderSinglePage(sessionId: string, pageNumber: number): Promise<{ html: string }> {
  const res = await fetch(`http://localhost:3001/api/workflow/render/page`, {
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

export async function exportPptx(sessionId: string): Promise<ExportResponse> {
  const res = await fetch(`${API_BASE}/export/pptx`, {
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

export async function exportHtml(sessionId: string): Promise<ExportResponse> {
  const res = await fetch(`${API_BASE}/export/html`, {
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
