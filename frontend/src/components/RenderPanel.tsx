'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Pencil, RefreshCw, X } from 'lucide-react';
import type { RenderedPage } from '@/lib/api';
import { modifyRenderedPage, renderSinglePage } from '@/lib/api';

interface RenderPanelProps {
  pages: RenderedPage[];
  isLoading: boolean;
  isExporting: boolean;
  sessionId: string | null;
  onPagesUpdate: (pages: RenderedPage[]) => void;
  onExportPptx: () => void;
  onExportHtml: () => void;
  onGoBack: () => void;
}

export default function RenderPanel({ pages, isLoading, isExporting, sessionId, onPagesUpdate, onExportPptx, onExportHtml, onGoBack }: RenderPanelProps) {
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
          <h2 className="text-lg font-semibold text-slate-800">页面渲染</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">正在逐页渲染...</p>
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
    try {
      const result = await modifyRenderedPage(sessionId, pageNumber, feedback.trim());
      const updated = pages.map(p => p.page_number === pageNumber ? { ...p, html: result.html } : p);
      onPagesUpdate(updated);
      setEditingPage(null);
      setFeedback('');
    } catch (err) {
      console.error(err);
    } finally {
      setModifying(false);
    }
  };

  const handleRegenerate = async (pageNumber: number) => {
    if (!sessionId) return;
    setModifying(true);
    try {
      const result = await renderSinglePage(sessionId, pageNumber);
      const updated = pages.map(p => p.page_number === pageNumber ? { ...p, html: result.html } : p);
      onPagesUpdate(updated);
    } catch (err) {
      console.error(err);
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

        {!isLoading && pages.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onExportPptx}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Download size={14} />
              {isExporting ? '导出中...' : '下载 PPTX'}
            </button>
            <button
              onClick={onExportHtml}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Download size={14} />
              下载 HTML
            </button>
          </div>
        )}
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
                  title="重新生成"
                >
                  <RefreshCw size={12} />
                  重新生成
                </button>
                <button
                  onClick={() => { setEditingPage(page.page_number); setFeedback(''); }}
                  disabled={modifying}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                  title="修改此页"
                >
                  <Pencil size={12} />
                  修改
                </button>
              </div>
            </div>

            {/* 幻灯片容器 - 固定 16:9，内容缩放填满 */}
            <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                srcDoc={wrapHtmlForDisplay(page.html)}
                className="absolute inset-0 w-full h-full border-0"
                title={`Slide ${page.page_number}`}
                sandbox="allow-scripts"
              />
            </div>

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
            <span className="text-sm text-slate-400">正在渲染下一页...</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 包裹 HTML 确保在 iframe 中正确缩放填满容器
 */
function wrapHtmlForDisplay(html: string): string {
  // 如果 HTML 已经包含完整结构，注入缩放样式
  if (html.includes('<html') || html.includes('<!DOCTYPE')) {
    // 注入一个 viewport meta 和缩放脚本
    const scaleScript = `
<script>
(function() {
  var slide = document.querySelector('.slide') || document.body.firstElementChild || document.body;
  var sw = 1280, sh = 720;
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    var scale = Math.min(w / sw, h / sh);
    slide.style.transform = 'scale(' + scale + ')';
    slide.style.transformOrigin = 'top left';
    slide.style.width = sw + 'px';
    slide.style.height = sh + 'px';
  }
  resize();
  window.addEventListener('resize', resize);
})();
</script>`;
    // 在 </body> 前注入
    if (html.includes('</body>')) {
      return html.replace('</body>', scaleScript + '</body>');
    }
    return html + scaleScript;
  }
  return html;
}
