'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface PlanningPage {
  page_number: number;
  title: string;
  goal: string;
  core_messages: string[];
  evidence_suggestions?: string[];
  visual_type: string;
  layout_direction?: string;
  keywords?: string[];
  design_notes?: string;
}

interface PlanningPanelProps {
  planning: Record<string, unknown> | null;
  isLoading: boolean;
  onRefinePage: (pageNumber: number, feedback: string) => void;
  onConfirm: () => void;
  onGoBack: () => void;
}

export default function PlanningPanel({ planning, isLoading, onRefinePage, onConfirm, onGoBack }: PlanningPanelProps) {
  if (!planning) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-64 text-slate-400">
        <p>策划稿尚未生成</p>
        <button onClick={onGoBack} className="mt-3 text-sm text-primary-600 hover:underline">返回大纲</button>
      </div>
    );
  }

  const data = (planning as { planning_draft?: { pages: PlanningPage[]; style?: string } }).planning_draft || planning;
  const pages: PlanningPage[] = Array.isArray((data as Record<string, unknown>).pages) ? (data as { pages: PlanningPage[] }).pages : [];
  const style = (data as { style?: string }).style || '';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">策划稿</h2>
          <span className="text-xs text-slate-400">共 {pages.length} 页</span>
        </div>
      </div>

      {style && (
        <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">{style}</p>
      )}

      {/* 逐页卡片 */}
      <div className="grid gap-4">
        {pages.map((page) => (
          <motion.div
            key={page.page_number}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: page.page_number * 0.03 }}
            className="bg-white border border-slate-200 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded">P{page.page_number}</span>
                <span className="text-sm font-semibold text-slate-800">{page.title}</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full shrink-0">{page.visual_type}</span>
            </div>

            <p className="text-xs text-slate-500 mb-3">{page.goal}</p>

            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">核心信息</div>
                <ul className="space-y-0.5">
                  {page.core_messages.map((msg, i) => (
                    <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-primary-200">{msg}</li>
                  ))}
                </ul>
              </div>

              {page.keywords && page.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {page.keywords.map((kw, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{kw}</span>
                  ))}
                </div>
              )}

              {page.design_notes && (
                <p className="text-xs text-slate-400 italic">{page.design_notes}</p>
              )}
            </div>

            <button
              onClick={() => {
                const feedback = prompt(`修改第 ${page.page_number} 页的意见：`);
                if (feedback) onRefinePage(page.page_number, feedback);
              }}
              disabled={isLoading}
              className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              修改此页
            </button>
          </motion.div>
        ))}
      </div>

      {/* 确认按钮 */}
      <div className="sticky bottom-0 bg-surface-secondary pt-4 pb-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? '渲染中...' : '确认策划稿，开始渲染'}
        </button>
      </div>
    </div>
  );
}
