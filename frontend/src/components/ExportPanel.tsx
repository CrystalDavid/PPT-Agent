'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Download, Globe, File } from 'lucide-react';

interface ExportPanelProps {
  isExporting: boolean;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onGoBack: () => void;
}

export default function ExportPanel({ isExporting, onExportHtml, onExportPdf, onGoBack }: ExportPanelProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">导出交付</h2>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <p className="text-sm text-slate-500">页面效果已确认，选择导出格式：</p>

        {/* PDF */}
        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="w-full flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all disabled:opacity-50 text-left"
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <File size={24} className="text-red-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800">下载 PDF</div>
            <div className="text-xs text-slate-500 mt-0.5">高保真 PDF 文件，适合打印和分享，视觉效果与预览一致</div>
          </div>
          <Download size={18} className="text-slate-400" />
        </button>

        {/* HTML */}
        <button
          onClick={onExportHtml}
          disabled={isExporting}
          className="w-full flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-primary-300 hover:shadow-sm transition-all disabled:opacity-50 text-left"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Globe size={24} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-800">下载 HTML 预览</div>
            <div className="text-xs text-slate-500 mt-0.5">包含所有页面的 HTML 文件，可在浏览器中查看</div>
          </div>
          <Download size={18} className="text-slate-400" />
        </button>

        {isExporting && (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mr-3" />
            <span className="text-sm text-slate-400">正在生成文件...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
