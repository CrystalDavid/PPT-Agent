'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ChatInput from '@/components/ChatInput';
import ChatArea from '@/components/ChatArea';
import BriefPanel from '@/components/BriefPanel';
import OutlinePanel from '@/components/OutlinePanel';
import PlanningPanel from '@/components/PlanningPanel';
import RenderPanel from '@/components/RenderPanel';
import {
  sendMessage,
  refineBrief,
  generateOutline,
  refineOutline,
  generatePlanningDraft,
  refinePlanningPage,
  renderAllPages,
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
  const [loadingText, setLoadingText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [outline, setOutline] = useState<Record<string, unknown> | null>(null);
  const [planning, setPlanning] = useState<Record<string, unknown> | null>(null);
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStageClick = (clickedStage: WorkflowStage) => {
    setActivePanel(clickedStage);
  };

  // 第一阶段：对话
  const handleSend = async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingText('AI 正在思考...');

    try {
      const data: ChatResponse = await sendMessage(sessionId, content);
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.brief) {
        setBrief(data.brief);
        setStage('brief');
        setActivePanel('brief');
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '请求失败';
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，出现了错误：${errorMsg}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // 修改调研底稿
  const handleRefineBrief = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    setLoadingText('正在修改调研底稿...');
    try {
      const data = await refineBrief(sessionId, feedback);
      setBrief(data.brief);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '修改底稿失败');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // 确认底稿，进入大纲阶段
  const handleConfirmBrief = () => {
    setStage('outline');
    setActivePanel('outline');
  };

  // 第二阶段：生成大纲
  const handleGenerateOutline = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setLoadingText('正在生成大纲...');
    try {
      const data = await generateOutline(sessionId);
      setOutline(data.outline);
      setStage('outline');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '生成大纲失败');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const handleRefineOutline = async (feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    setLoadingText('正在修改大纲...');
    try {
      const data = await refineOutline(sessionId, feedback);
      setOutline(data.outline);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '修改大纲失败');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const handleConfirmOutline = () => {
    setStage('planning');
    setActivePanel('planning');
    if (!planning) handleGeneratePlanning();
  };

  // 第三阶段：生成策划稿
  const handleGeneratePlanning = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setLoadingText('正在生成策划稿...');
    try {
      const data = await generatePlanningDraft(sessionId);
      setPlanning(data.planning);
      setStage('planning');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '生成策划稿失败');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const handleRefinePlanningPage = async (pageNumber: number, feedback: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    setLoadingText(`正在修改第 ${pageNumber} 页...`);
    try {
      const data = await refinePlanningPage(sessionId, pageNumber, feedback);
      setPlanning(data.planning);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '修改策划稿失败');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // 第四阶段：渲染页面
  const handleRenderPages = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setLoadingText('正在渲染页面（约 1~2 分钟）...');
    setStage('render');
    setActivePanel('render');
    try {
      const data = await renderAllPages(sessionId);
      setRenderedPages(data.pages);
      setStage('export');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '渲染失败');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // 第五阶段：导出
  const handleExportPptx = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    try {
      const data = await exportPptx(sessionId);
      window.open(data.downloadUrl, '_blank');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '导出 PPTX 失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    try {
      const data = await exportHtml(sessionId);
      window.open(data.downloadUrl, '_blank');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '导出 HTML 失败');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface-secondary">
      <Sidebar
        currentStage={stage}
        activePanel={activePanel}
        onStageClick={handleStageClick}
        hasBrief={!!brief}
        hasOutline={!!outline}
        hasPlanning={!!planning}
        hasRender={renderedPages.length > 0}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center px-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
          <h1 className="text-base font-semibold text-slate-700">PPT Agent</h1>
          {isLoading && (
            <div className="ml-4 flex items-center gap-2 text-sm text-slate-400">
              <div className="w-3 h-3 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
              {loadingText}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* 访谈阶段 */}
            {activePanel === 'interview' && (
              <motion.div
                key="interview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
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
              </motion.div>
            )}

            {/* 调研底稿阶段 */}
            {activePanel === 'brief' && (
              <motion.div
                key="brief"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 overflow-y-auto h-full"
              >
                <BriefPanel
                  brief={brief}
                  isLoading={isLoading}
                  onConfirm={handleConfirmBrief}
                  onRefine={handleRefineBrief}
                  onGoBack={() => setActivePanel('interview')}
                />
              </motion.div>
            )}

            {/* 大纲阶段 */}
            {activePanel === 'outline' && (
              <motion.div
                key="outline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 overflow-y-auto h-full"
              >
                <OutlinePanel
                  outline={outline}
                  isLoading={isLoading}
                  onGenerate={handleGenerateOutline}
                  onRefine={handleRefineOutline}
                  onConfirm={handleConfirmOutline}
                  onGoBack={() => setActivePanel('brief')}
                />
              </motion.div>
            )}

            {/* 策划稿阶段 */}
            {activePanel === 'planning' && (
              <motion.div
                key="planning"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 overflow-y-auto h-full"
              >
                <PlanningPanel
                  planning={planning}
                  isLoading={isLoading}
                  onRefinePage={handleRefinePlanningPage}
                  onConfirm={handleRenderPages}
                  onGoBack={() => setActivePanel('outline')}
                />
              </motion.div>
            )}

            {/* 渲染/导出阶段 */}
            {(activePanel === 'render' || activePanel === 'export') && (
              <motion.div
                key="render"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 overflow-y-auto h-full"
              >
                <RenderPanel
                  pages={renderedPages}
                  isLoading={isLoading}
                  isExporting={isExporting}
                  onExportPptx={handleExportPptx}
                  onExportHtml={handleExportHtml}
                  onGoBack={() => setActivePanel('planning')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
