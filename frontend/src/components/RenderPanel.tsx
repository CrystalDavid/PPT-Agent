'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import type { RenderedPage } from '@/lib/api';

interface RenderPanelProps {
  pages: RenderedPage[];
  isLoading: boolean;
  isExporting: boolean;
  onExportPptx: () => void;
  onExportHtml: () => void;
  onGoBack: () => void;
}

export default function RenderPanel({ pages, isLoading, isExporting, onExportPptx, onExportHtml, onGoBack }: RenderPanelProps) {
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
          <p className="text-sm text-slate-400">正在逐页渲染 HTML 演示页面...</p>
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

        {/* 导出按钮 */}
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
      <div className="space-y-6">
        {pages.map((page, idx) => (
          <motion.div
            key={page.page_number}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {/* 页码标签 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded">P{page.page_number}</span>
              <span className="text-sm text-slate-600">{page.title}</span>
            </div>

            {/* 幻灯片容器 - 固定 16:9 比例 */}
            <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                srcDoc={page.html}
                className="absolute inset-0 w-full h-full border-0"
                title={`Slide ${page.page_number}`}
                sandbox="allow-scripts"
                style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
              />
            </div>
          </motion.div>
        ))}

        {/* 加载中指示器 */}
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
