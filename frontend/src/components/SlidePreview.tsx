'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { RenderedPage } from '@/lib/api';

interface SlidePreviewProps {
  pages: RenderedPage[];
  onExportPptx: () => void;
  onExportHtml: () => void;
  isExporting: boolean;
}

export default function SlidePreview({ pages, onExportPptx, onExportHtml, isExporting }: SlidePreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (pages.length === 0) return null;

  const page = pages[currentPage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">页面预览</h2>
        <span className="text-xs text-slate-400">
          {currentPage + 1} / {pages.length}
        </span>
      </div>

      {/* 预览区域 */}
      <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-lg">
        <div className="aspect-video w-full">
          <iframe
            srcDoc={page.html}
            className="w-full h-full border-0"
            title={`Slide ${page.page_number}`}
            sandbox="allow-scripts"
          />
        </div>
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-white">
          P{page.page_number}: {page.title}
        </div>
      </div>

      {/* 翻页控制 */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          上一页
        </button>

        {/* 页码点 */}
        <div className="flex gap-1 mx-3">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentPage ? 'bg-primary-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
          disabled={currentPage === pages.length - 1}
          className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          下一页
        </button>
      </div>

      {/* 导出按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onExportPptx}
          disabled={isExporting}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isExporting ? '导出中...' : '下载 PPTX'}
        </button>
        <button
          onClick={onExportHtml}
          disabled={isExporting}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          下载 HTML 预览
        </button>
      </div>
    </motion.div>
  );
}
