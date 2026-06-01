'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, RefreshCw, X } from 'lucide-react';
import type { RenderedPage } from '@/lib/api';
import { modifyRenderedPage, renderSinglePage } from '@/lib/api';

interface RenderPanelProps {
  pages: RenderedPage[];
  isLoading: boolean;
  sessionId: string | null;
  onPagesUpdate: (pages: RenderedPage[]) => void;
  onLog: (type: 'request' | 'response' | 'info' | 'error', content: string) => void;
  onConfirm: () => void;
  onGoBack: () => void;
}

export default function RenderPanel({ pages, isLoading, sessionId, onPagesUpdate, onLog, onConfirm, onGoBack }: RenderPanelProps) {
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [modifying, setModifying] = useState(false);

  if (isLoading && pages.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">SVG 页面生成</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">正在逐页生成 SVG...</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center h-64 text-slate-400">
        <p>尚未渲染页面</p>
        <button onClick={onGoBack} className="mt-3 text-sm text-primary-600 hover:underline">返回策划稿</button>
      </div>
    );
  }

  const handleModify = async (pageNumber: number) => {
    if (!sessionId || !feedback.trim()) return;
    setModifying(true);
    onLog('request', `修改第 ${pageNumber} 页 SVG：${feedback.trim()}`);
    try {
      const result = await modifyRenderedPage(sessionId, pageNumber, feedback.trim());
      const updated = pages.map(p => p.page_number === pageNumber ? { ...p, svg: result.svg, html: result.html } : p);
      onPagesUpdate(updated);
      setEditingPage(null);
      setFeedback('');
      onLog('info', `第 ${pageNumber} 页 SVG 修改完成`);
    } catch (err) {
      console.error(err);
      onLog('error', `第 ${pageNumber} 页 SVG 修改失败：${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setModifying(false);
    }
  };

  const handleRegenerate = async (pageNumber: number) => {
    if (!sessionId) return;
    setModifying(true);
    onLog('request', `重新生成第 ${pageNumber} 页 SVG...`);
    try {
      const result = await renderSinglePage(sessionId, pageNumber);
      const updated = pages.map(p => p.page_number === pageNumber ? { ...p, svg: result.svg, html: result.html } : p);
      onPagesUpdate(updated);
      onLog('info', `第 ${pageNumber} 页 SVG 重新生成完成`);
    } catch (err) {
      console.error(err);
      onLog('error', `第 ${pageNumber} 页 SVG 重新生成失败：${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setModifying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between sticky top-0 bg-surface-secondary py-3 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">页面预览</h2>
          <span className="text-xs text-slate-400">
            {isLoading ? `已渲染 ${pages.length} 页，继续中...` : `共 ${pages.length} 页`}
          </span>
        </div>
      </div>

      {/* 所有页面竖向排列 */}
      <div className="space-y-8">
        {pages.map((page, idx) => (
          <motion.div
            key={page.page_number}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group"
          >
            {/* 页码 + 操作按钮 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded">P{page.page_number}</span>
                <span className="text-sm text-slate-600">{page.title}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleRegenerate(page.page_number)}
                  disabled={modifying}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} />
                  重新生成
                </button>
                <button
                  onClick={() => { setEditingPage(page.page_number); setFeedback(''); onLog('info', `打开第 ${page.page_number} 页修改框`); }}
                  disabled={modifying}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Pencil size={12} />
                  修改
                </button>
              </div>
            </div>

            {/* 幻灯片容器 - 固定 16:9 比例，直接预览 SVG 源产物 */}
            <SlideFrame svg={page.svg} html={page.html} pageNumber={page.page_number} />

            {/* 编辑区域 */}
            {editingPage === page.page_number && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 bg-white rounded-xl border border-primary-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary-700">修改第 {page.page_number} 页</span>
                  <button onClick={() => setEditingPage(null)} className="p-0.5 rounded hover:bg-slate-100 text-slate-400">
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="例如：把标题字号调大，背景改成深蓝色，表格内容精简一下..."
                  autoFocus
                  className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none outline-none focus:border-primary-400 transition-colors"
                />
                <button
                  onClick={() => handleModify(page.page_number)}
                  disabled={modifying || !feedback.trim()}
                  className="px-4 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {modifying ? '修改中...' : '提交修改'}
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}

        {/* 加载中 */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mr-3" />
            <span className="text-sm text-slate-400">正在生成下一页 SVG...</span>
          </div>
        )}
      </div>

      {/* 底部确认按钮 */}
      {!isLoading && pages.length > 0 && (
        <div className="sticky bottom-0 bg-surface-secondary pt-4 pb-2">
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            确认效果，进入导出
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * SlideFrame: previews the raw AI-generated SVG whenever available.
 * HTML is only a compatibility fallback for older rendered sessions.
 */
function SlideFrame({ svg, html, pageNumber }: { svg?: string; html: string; pageNumber: number }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.8); // sensible default for max-w-5xl (1024/1280)

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const w = container.clientWidth;
      if (w > 0) setScale(w / 1280);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const scaledHeight = 720 * scale;

  if (svg) {
    return (
      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden shadow-lg bg-slate-100"
        style={{ height: scaledHeight }}
      >
        <div
          className="origin-top-left bg-white"
          style={{ width: 1280, height: 720, transform: `scale(${scale})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-label={`Slide ${pageNumber}`}
        />
      </div>
    );
  }

  // Only inject a minimal reset that won't conflict with AI styles
  const resetStyle = `<style>html,body{margin:0;padding:0;overflow:hidden;}</style>`;
  let srcDoc = html;
  if (html.includes('</head>')) {
    srcDoc = html.replace('</head>', resetStyle + '</head>');
  } else if (html.includes('<body')) {
    srcDoc = html.replace('<body', resetStyle + '<body');
  } else {
    srcDoc = resetStyle + html;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden shadow-lg bg-slate-100"
      style={{ height: scaledHeight }}
    >
      <iframe
        srcDoc={srcDoc}
        style={{
          width: 1280,
          height: 720,
          border: 'none',
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}
        title={`Slide ${pageNumber}`}
        sandbox="allow-scripts"
      />
    </div>
  );
}
