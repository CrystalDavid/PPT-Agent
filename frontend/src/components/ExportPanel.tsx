'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Archive, Download, File, Globe, Presentation } from 'lucide-react';

interface ExportPanelProps {
  isExporting: boolean;
  canExportSession: boolean;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
  onExportSession: () => void;
  onGoBack: () => void;
}

export default function ExportPanel({
  isExporting,
  canExportSession,
  onExportHtml,
  onExportPdf,
  onExportPptx,
  onExportSession,
  onGoBack,
}: ExportPanelProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onGoBack} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">导出交付</h2>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <p className="text-sm text-slate-500">页面效果已确认，选择导出格式。</p>

        <ExportButton
          title="下载可编辑 PPTX"
          description="SVG 转 PowerPoint 原生对象，文字和主要图形可继续编辑"
          icon={Presentation}
          iconClassName="bg-blue-50 text-blue-600"
          disabled={isExporting}
          primary
          onClick={onExportPptx}
        />
        <ExportButton
          title="下载 PDF"
          description="高保真 PDF 文件，适合打印和分享，视觉效果与预览一致"
          icon={File}
          iconClassName="bg-red-50 text-red-500"
          disabled={isExporting}
          onClick={onExportPdf}
        />
        <ExportButton
          title="下载 HTML 预览"
          description="包含所有页面的 HTML 文件，可在浏览器中查看"
          icon={Globe}
          iconClassName="bg-cyan-50 text-cyan-600"
          disabled={isExporting}
          onClick={onExportHtml}
        />
        <ExportButton
          title="导出当前会话数据"
          description="保存访谈、底稿、大纲、策划稿和已生成 SVG，下次可导入继续修改"
          icon={Archive}
          iconClassName="bg-emerald-50 text-emerald-600"
          disabled={isExporting || !canExportSession}
          onClick={onExportSession}
        />

        {isExporting && (
          <div className="flex items-center justify-center py-4">
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
            <span className="text-sm text-slate-400">正在生成文件...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface ExportButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  disabled: boolean;
  primary?: boolean;
  onClick: () => void;
}

function ExportButton({
  title,
  description,
  icon: Icon,
  iconClassName,
  disabled,
  primary,
  onClick,
}: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? 'border border-blue-200 hover:border-blue-400 hover:shadow-sm'
          : 'border border-slate-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="mt-0.5 text-xs leading-5 text-slate-500">{description}</div>
      </div>
      <Download size={18} className="text-slate-400" />
    </button>
  );
}
