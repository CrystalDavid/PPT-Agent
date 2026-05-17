'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInput from '@/components/ChatInput';
import ChatArea from '@/components/ChatArea';
import BriefPanel from '@/components/BriefPanel';
import OutlinePanel from '@/components/OutlinePanel';
import PlanningPanel from '@/components/PlanningPanel';
import RenderPanel from '@/components/RenderPanel';
import ExportPanel from '@/components/ExportPanel';
import AiLogPanel, { type LogEntry } from '@/components/AiLogPanel';
import {
  sendMessage,
  refineBrief,
  generateOutline,
  refineOutline,
  generatePlanningDraft,
  refinePlanningPage,
  refinePlanningAll,
  renderSinglePage,
  exportPptx,
  exportHtml,
  type ChatResponse,
  type RenderedPage,
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

export default function Home() {
  const [stage, setStage] = useState<WorkflowStage>('interview');
  const [activePanel, setActivePanel] = useState<WorkflowStage>('interview');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [outline, setOutline] = useState<Record<string, unknown> | null>(null);
  const [planning, setPlanning] = useState<Record<string, unknown> | null>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addLog = useCallback((type: LogEntry['type'], content: string) => {
    setLogs((prev) => [...prev, { id: Date.now().toString() + Math.random(), timestamp: Date.now(), type, content }]);
  }, []);

  const handleStageClick = (clickedStage: WorkflowStage) => {
    setActivePanel(clickedStage);
  };

  // 第一阶段：对话
  const handleSend = async (content: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    addLog('request', `用户输入: ${content}`);

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
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, timestamp: Date.now() }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '请求失败';
      addLog('error', msg);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: `出现错误：${msg}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 修改底稿
  const handleRefineBrief = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改底稿: ${feedback}`);
    try {
      const data = await refineBrief(sessionId, feedback);
      setBrief(data.brief);
      addLog('info', '底稿已更新');
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBrief = () => {
    setStage('outline');
    setActivePanel('outline');
    if (!outline) handleGenerateOutline();
  };

  // 生成大纲
  const handleGenerateOutline = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', '生成大纲...');
    try {
      const data = await generateOutline(sessionId);
      setOutline(data.outline);
      setStage('outline');
      addLog('info', '大纲已生成');
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineOutline = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改大纲: ${feedback}`);
    try {
      const data = await refineOutline(sessionId, feedback);
      setOutline(data.outline);
      addLog('info', '大纲已更新');
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOutline = () => {
    setStage('planning');
    setActivePanel('planning');
    if (!planning) handleGeneratePlanning();
  };

  // 生成策划稿
  const handleGeneratePlanning = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', '生成策划稿...');
    try {
      const data = await generatePlanningDraft(sessionId);
      setPlanning(data.planning);
      setStage('planning');
      addLog('info', '策划稿已生成');
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinePlanningPage = async (pageNumber: number, feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改策划稿第 ${pageNumber} 页: ${feedback}`);
    try {
      const data = await refinePlanningPage(sessionId, pageNumber, feedback);
      setPlanning(data.planning);
      addLog('info', `第 ${pageNumber} 页已更新`);
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefinePlanningAll = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    addLog('request', `修改整体策划稿: ${feedback}`);
    try {
      const data = await refinePlanningAll(sessionId, feedback);
      setPlanning(data.planning);
      addLog('info', '策划稿已整体更新');
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '修改失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染 — 逐页渲染，每页一个请求，避免超时
  const handleRenderPages = async () => {
    if (!sessionId || !planning) return;
    setIsLoading(true);
    setStage('render');
    setActivePanel('render');
    addLog('request', '开始逐页渲染...');

    const planData = (planning as { planning_draft?: { pages: { page_number: number; title: string }[] } }).planning_draft || planning as { pages: { page_number: number; title: string }[] };
    const pageList = Array.isArray((planData as Record<string, unknown>).pages) ? (planData as { pages: { page_number: number; title: string }[] }).pages : [];

    const rendered: RenderedPage[] = [];
    try {
      for (const page of pageList) {
        addLog('info', `渲染第 ${page.page_number} 页: ${page.title}...`);
        const result = await renderSinglePage(sessionId, page.page_number);
        rendered.push({ page_number: page.page_number, title: page.title, html: result.html });
        setRenderedPages([...rendered]); // 逐页更新，用户可以实时看到
      }
      setStage('export');
      addLog('info', `渲染完成，共 ${rendered.length} 页`);
    } catch (err: unknown) {
      addLog('error', `渲染第 ${rendered.length + 1} 页失败: ${err instanceof Error ? err.message : '未知错误'}`);
      if (rendered.length > 0) {
        addLog('info', `已成功渲染 ${rendered.length} 页，可以先预览已完成的部分`);
        setStage('export');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 导出
  const handleExportPptx = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    addLog('request', '导出 PPTX...');
    try {
      const data = await exportPptx(sessionId);
      window.open(data.downloadUrl, '_blank');
      addLog('info', `PPTX 已生成: ${data.filename}`);
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    addLog('request', '导出 HTML...');
    try {
      const data = await exportHtml(sessionId);
      window.open(data.downloadUrl, '_blank');
      addLog('info', `HTML 已生成: ${data.filename}`);
    } catch (err: unknown) {
      addLog('error', err instanceof Error ? err.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface-secondary">
      {/* 左侧边栏 */}
      <Sidebar
        currentStage={stage}
        activePanel={activePanel}
        onStageClick={handleStageClick}
        hasBrief={!!brief}
        hasOutline={!!outline}
        hasPlanning={!!planning}
        hasRender={renderedPages.length > 0}
      />

      {/* 中间主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center px-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
          <h1 className="text-base font-semibold text-slate-700">PPT Agent</h1>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* 访谈 */}
          <div className={activePanel === 'interview' ? 'h-full flex flex-col' : 'hidden'}>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h2 className="text-2xl font-semibold text-slate-800 mb-2">开始创建你的演示文稿</h2>
                  <p className="text-slate-500 max-w-md">告诉我你想做什么 PPT，我会通过几轮对话帮你理清思路</p>
                </div>
              ) : (
                <ChatArea messages={messages} isLoading={isLoading} />
              )}
              <div ref={bottomRef} />
            </div>
            <div className="px-6 pb-6 shrink-0">
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>

          {/* 调研底稿 */}
          <div className={activePanel === 'brief' ? 'p-6 h-full overflow-y-auto' : 'hidden'}>
            <BriefPanel brief={brief} isLoading={isLoading} onConfirm={handleConfirmBrief} onRefine={handleRefineBrief} onGoBack={() => setActivePanel('interview')} />
          </div>

          {/* 大纲 */}
          <div className={activePanel === 'outline' ? 'p-6 h-full overflow-y-auto' : 'hidden'}>
            <OutlinePanel outline={outline} isLoading={isLoading} onGenerate={handleGenerateOutline} onRefine={handleRefineOutline} onConfirm={handleConfirmOutline} onGoBack={() => setActivePanel('brief')} />
          </div>

          {/* 策划稿 */}
          <div className={activePanel === 'planning' ? 'p-6 h-full overflow-y-auto' : 'hidden'}>
            <PlanningPanel planning={planning} isLoading={isLoading} onGenerate={handleGeneratePlanning} onRefinePage={handleRefinePlanningPage} onRefineAll={handleRefinePlanningAll} onConfirm={handleRenderPages} onGoBack={() => setActivePanel('outline')} />
          </div>

          {/* 渲染预览 */}
          <div className={activePanel === 'render' ? 'p-6 h-full overflow-y-auto' : 'hidden'}>
            <RenderPanel pages={renderedPages} isLoading={isLoading} sessionId={sessionId} onPagesUpdate={setRenderedPages} onConfirm={() => { setStage('export'); setActivePanel('export'); }} onGoBack={() => setActivePanel('planning')} />
          </div>

          {/* 导出交付 */}
          <div className={activePanel === 'export' ? 'p-6 h-full overflow-y-auto' : 'hidden'}>
            <ExportPanel isExporting={isExporting} onExportPptx={handleExportPptx} onExportHtml={handleExportHtml} onGoBack={() => setActivePanel('render')} />
          </div>
        </div>
      </main>

      {/* 右侧 AI 日志面板 */}
      <AiLogPanel logs={logs} onClear={() => setLogs([])} />
    </div>
  );
}
