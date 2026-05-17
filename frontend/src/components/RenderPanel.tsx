'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(0);

  if (isLoading && pages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500">正在逐页渲染 HTML 演示页面...</p>
        <p className="text-xs text-slate-400 mt-1">这可能需要 1~2 分钟</p>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-64 text-slate-400">
        <p>尚未渲染页面</p>
        <button onClick={onGoBack} className="mt-3 text-sm text-primary-600 hover:underline">返回策划稿</button>
      </div>
    );
  }

  const page = pages[currentPage];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">页面预览</h2>
        <span className="text-xs text-slate-400">{currentPage + 1} / {pages.length}</span>
      </div>

      {/* 预览区域 */}
      <motion.div
        key={currentPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-slate-900 rounded-xl overflow-hidden shadow-xl"
      >
        <div className="aspect-video w-full">
          <iframe
            srcDoc={page.html}
            className="w-full h-full border-0"
            title={`Slide ${page.page_number}`}
            sandbox="allow-scripts"
          />
        </div>
        <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 rounded-lg text-xs text-white backdrop-blur-sm">
          P{page.page_number}: {page.title}
        </div>
      </motion.div>

      {/* 翻页控制 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-1.5">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage ? 'bg-primary-600 scale-125' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
          disabled={currentPage === pages.length - 1}
          className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 导出按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onExportPptx}
          disabled={isExporting}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isExporting ? '导出中...' : '下载 PPTX'}
        </button>
        <button
          onClick={onExportHtml}
          disabled={isExporting}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          下载 HTML 预览
        </button>
      </div>
    </div>
  );
}
