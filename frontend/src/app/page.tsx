'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInput from '@/components/ChatInput';
import ChatArea from '@/components/ChatArea';
import BriefPanel from '@/components/BriefPanel';
import OutlinePanel from '@/components/OutlinePanel';
import PlanningPanel from '@/components/PlanningPanel';
import RenderPanel from '@/components/RenderPanel';
import ExportPanel from '@/components/ExportPanel';
import AiLogPanel, { type LogEntry } from '@/components/AiLogPanel';
import WelcomeScreen from '@/components/WelcomeScreen';
import {
  BACKEND_ORIGIN,
  exportHtml,
  exportPdf,
  exportPptx,
  exportSession,
  generateOutline,
  generatePlanningDraft,
  importSessionFile,
  refineBrief,
  refineOutline,
  refinePlanningAll,
  refinePlanningPage,
  renderSinglePage,
  sendMessage,
  type ChatResponse,
  type RenderedPage,
  type SessionState,
} from '@/lib/api';

export type WorkflowStage =
  | 'interview'
  | 'brief'
  | 'outline'
  | 'planning'
  | 'render'
  | 'export';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const workflowStages: WorkflowStage[] = ['interview', 'brief', 'outline', 'planning', 'render', 'export'];
const stageLabels: Record<WorkflowStage, string> = {
  interview: '需求访谈',
  brief: '调研底稿',
  outline: '大纲',
  planning: '策划稿',
  render: 'SVG 预览',
  export: '导出交付',
};

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stage, setStage] = useState<WorkflowStage>('interview');
  const [activePanel, setActivePanel] = useState<WorkflowStage>('interview');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [outline, setOutline] = useState<Record<string, unknown> | null>(null);
  const [planning, setPlanning] = useState<Record<string, unknown> | null>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addLog = useCallback((type: LogEntry['type'], content: string) => {
    setLogs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), type, content }]);
  }, []);

  const resetWorkflow = useCallback(() => {
    setStage('interview');
    setActivePanel('interview');
    setMessages([]);
    setSessionId(null);
    setBrief(null);
    setOutline(null);
    setPlanning(null);
    setRenderedPages([]);
    setIsLoading(false);
    setIsExporting(false);
    setLogs([]);
  }, []);

  const handleStartNew = () => {
    resetWorkflow();
    setShowWelcome(false);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const data = await importSessionFile(payload);
      restoreSession(data.sessionId, data.session);
      setShowWelcome(false);
      setLogs([{ id: `${Date.now()}`, timestamp: Date.now(), type: 'info', content: `已导入会话文件：${file.name}` }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导入失败';
      window.alert(`导入旧会话失败：${msg}`);
    } finally {
      setIsImporting(false);
    }
  };

  const restoreSession = (nextSessionId: string, imported: SessionState) => {
    const restoredPages = normalizeRenderedPages(imported.renderedPages);
    const restoredStage = resolveStageFromSession(imported, restoredPages);

    setSessionId(nextSessionId);
    setStage(restoredStage);
    setActivePanel(restoredStage);
    setMessages(normalizeMessages(imported.messages));
    setBrief(recordOrNull(imported.brief));
    setOutline(recordOrNull(imported.outline));
    setPlanning(recordOrNull(imported.planning));
    setRenderedPages(restoredPages);
    setIsLoading(false);
    setIsExporting(false);
  };

  const handleStageClick = (clickedStage: WorkflowStage) => {
    setActivePanel(clickedStage);
    addLog('info', `切换到：${stageLabels[clickedStage]}`);
  };

  const handleSend = async (content: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    addLog('request', `用户输入：${content}`);

    try {
      const data: ChatResponse = await sendMessage(sessionId, content);
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.brief) {
        setBrief(data.brief);
        setStage('brief');
        setActivePanel('brief');
        addLog('info', '调研底稿已生成');
      }
      addLog('response', data.reply.substring(0, 200) + (data.reply.length > 200 ? '...' : ''));
      setMessages((prev) => [...prev, { id: `${Date.now() + 1}`, role: 'assistant', content: data.reply, timestamp: Date.now() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败';
      addLog('error', msg);
      setMessages((prev) => [...prev, { id: `${Date.now() + 1}`, role: 'assistant', content: `出现错误：${msg}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineBrief = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改底稿：${feedback}`);
    try {
      const data = await refineBrief(sessionId, feedback);
      setBrief(data.brief);
      addLog('info', '底稿已更新');
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBrief = () => {
    addLog('info', '确认调研底稿，进入大纲阶段');
    setStage('outline');
    setActivePanel('outline');
    if (!outline) handleGenerateOutline();
  };

  const handleGenerateOutline = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', '生成大纲...');
    try {
      const data = await generateOutline(sessionId);
      setOutline(data.outline);
      setStage('outline');
      addLog('info', '大纲已生成');
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineOutline = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改大纲：${feedback}`);
    try {
      const data = await refineOutline(sessionId, feedback);
      setOutline(data.outline);
      addLog('info', '大纲已更新');
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOutline = () => {
    addLog('info', '确认大纲，进入策划稿阶段');
    setStage('planning');
    setActivePanel('planning');
    if (!planning) handleGeneratePlanning();
  };

  const handleGeneratePlanning = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', '生成策划稿...');
    try {
      const data = await generatePlanningDraft(sessionId);
      setPlanning(data.planning);
      setStage('planning');
      addLog('info', '策划稿已生成');
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinePlanningPage = async (pageNumber: number, feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改策划稿第 ${pageNumber} 页：${feedback}`);
    try {
      const data = await refinePlanningPage(sessionId, pageNumber, feedback);
      setPlanning(data.planning);
      addLog('info', `第 ${pageNumber} 页已更新`);
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinePlanningAll = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改整体策划稿：${feedback}`);
    try {
      const data = await refinePlanningAll(sessionId, feedback);
      setPlanning(data.planning);
      addLog('info', '策划稿已整体更新');
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenderPages = async () => {
    if (!sessionId || !planning) return;
    setIsLoading(true);
    setStage('render');
    setActivePanel('render');
    addLog('request', '开始逐页生成 SVG...');

    const planData = (planning as { planning_draft?: { pages: { page_number: number; title: string }[] } }).planning_draft
      || planning as { pages: { page_number: number; title: string }[] };
    const pageList = Array.isArray((planData as Record<string, unknown>).pages)
      ? (planData as { pages: { page_number: number; title: string }[] }).pages
      : [];

    const rendered: RenderedPage[] = [];
    try {
      for (const page of pageList) {
        addLog('info', `生成第 ${page.page_number} 页 SVG：${page.title}...`);
        const result = await renderSinglePage(sessionId, page.page_number);
        rendered.push({ page_number: page.page_number, title: page.title, svg: result.svg, html: result.html });
        setRenderedPages([...rendered]);
      }
      setStage('export');
      addLog('info', `SVG 生成完成，共 ${rendered.length} 页`);
    } catch (err) {
      addLog('error', `生成第 ${rendered.length + 1} 页 SVG 失败：${err instanceof Error ? err.message : '未知错误'}`);
      if (rendered.length > 0) {
        addLog('info', `已成功渲染 ${rendered.length} 页，可以先预览已完成的部分`);
        setStage('export');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFromBackend = (downloadUrl: string) => {
    const a = document.createElement('a');
    a.href = `${BACKEND_ORIGIN}${downloadUrl}`;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleExportHtml = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    addLog('request', '导出 HTML...');
    try {
      const data = await exportHtml(sessionId);
      downloadFromBackend(data.downloadUrl);
      addLog('info', `HTML 已生成：${data.filename}`);
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    addLog('request', '导出 PDF...');
    try {
      const data = await exportPdf(sessionId);
      downloadFromBackend(data.downloadUrl);
      addLog('info', `PDF 已生成：${data.filename}`);
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPptx = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    addLog('request', '导出可编辑 PPTX...');
    try {
      const data = await exportPptx(sessionId);
      downloadFromBackend(data.downloadUrl);
      addLog('info', `PPTX 已生成：${data.filename}`);
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSession = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    addLog('request', '导出当前会话数据...');
    try {
      const data = await exportSession(sessionId);
      downloadFromBackend(data.downloadUrl);
      addLog('info', `会话数据已生成：${data.filename}`);
    } catch (err) {
      addLog('error', err instanceof Error ? err.message : '导出会话失败');
    } finally {
      setIsExporting(false);
    }
  };

  if (showWelcome) {
    return (
      <>
        <WelcomeScreen isImporting={isImporting} onStartNew={handleStartNew} onImport={handleImportClick} />
        <input
          ref={importInputRef}
          type="file"
          accept=".pptagent.json,.json,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#f7f9fc] text-slate-800">
      <Sidebar
        currentStage={stage}
        activePanel={activePanel}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        onStageClick={handleStageClick}
        hasBrief={!!brief}
        hasOutline={!!outline}
        hasPlanning={!!planning}
        hasRender={renderedPages.length > 0}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className={activePanel === 'interview' ? 'flex h-full flex-col' : 'hidden'}>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <h2 className="mb-8 text-3xl font-normal text-slate-800">开始创建你的演示文稿</h2>
                  <ChatInput onSend={handleSend} disabled={isLoading} className="max-w-[620px]" />
                </div>
              ) : (
                <ChatArea messages={messages} isLoading={isLoading} />
              )}
              <div ref={bottomRef} />
            </div>
            {messages.length > 0 && (
              <div className="shrink-0 px-6 pb-6">
                <ChatInput onSend={handleSend} disabled={isLoading} className="max-w-[620px]" />
              </div>
            )}
          </div>

          <div className={activePanel === 'brief' ? 'h-full overflow-y-auto p-6' : 'hidden'}>
            <BriefPanel
              brief={brief}
              isLoading={isLoading}
              onConfirm={handleConfirmBrief}
              onRefine={handleRefineBrief}
              onGoBack={() => setActivePanel('interview')}
            />
          </div>

          <div className={activePanel === 'outline' ? 'h-full overflow-y-auto p-6' : 'hidden'}>
            <OutlinePanel
              outline={outline}
              isLoading={isLoading}
              onGenerate={handleGenerateOutline}
              onRefine={handleRefineOutline}
              onConfirm={handleConfirmOutline}
              onGoBack={() => setActivePanel('brief')}
            />
          </div>

          <div className={activePanel === 'planning' ? 'h-full overflow-y-auto p-6' : 'hidden'}>
            <PlanningPanel
              planning={planning}
              isLoading={isLoading}
              onGenerate={handleGeneratePlanning}
              onRefinePage={handleRefinePlanningPage}
              onRefineAll={handleRefinePlanningAll}
              onConfirm={handleRenderPages}
              onGoBack={() => setActivePanel('outline')}
            />
          </div>

          <div className={activePanel === 'render' ? 'h-full overflow-y-auto p-6' : 'hidden'}>
            <RenderPanel
              pages={renderedPages}
              isLoading={isLoading}
              sessionId={sessionId}
              onPagesUpdate={setRenderedPages}
              onLog={addLog}
              onConfirm={() => { addLog('info', '确认 SVG 预览效果，进入导出交付'); setStage('export'); setActivePanel('export'); }}
              onGoBack={() => setActivePanel('planning')}
            />
          </div>

          <div className={activePanel === 'export' ? 'h-full overflow-y-auto p-6' : 'hidden'}>
            <ExportPanel
              isExporting={isExporting}
              canExportSession={!!sessionId}
              onExportHtml={handleExportHtml}
              onExportPdf={handleExportPdf}
              onExportPptx={handleExportPptx}
              onExportSession={handleExportSession}
              onGoBack={() => setActivePanel('render')}
            />
          </div>
        </div>
      </main>

      <AiLogPanel logs={logs} />
    </div>
  );
}

function isWorkflowStage(value: unknown): value is WorkflowStage {
  return typeof value === 'string' && workflowStages.includes(value as WorkflowStage);
}

function recordOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeMessages(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Partial<Message>;
    if (source.role !== 'user' && source.role !== 'assistant') return [];
    return [{
      id: typeof source.id === 'string' ? source.id : `imported-${index}`,
      role: source.role,
      content: typeof source.content === 'string' ? source.content : '',
      timestamp: typeof source.timestamp === 'number' ? source.timestamp : Date.now() + index,
    }];
  });
}

function normalizeRenderedPages(value: unknown): RenderedPage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Partial<RenderedPage>;
    if (typeof source.page_number !== 'number') return [];
    return [{
      page_number: source.page_number,
      title: typeof source.title === 'string' ? source.title : `第 ${source.page_number} 页`,
      svg: typeof source.svg === 'string' ? source.svg : undefined,
      html: typeof source.html === 'string' ? source.html : '',
    }];
  });
}

function resolveStageFromSession(session: SessionState, pages: RenderedPage[]): WorkflowStage {
  if (isWorkflowStage(session.stage)) return session.stage;
  if (pages.length > 0) return 'export';
  if (session.planning) return 'planning';
  if (session.outline) return 'outline';
  if (session.brief) return 'brief';
  return 'interview';
}
