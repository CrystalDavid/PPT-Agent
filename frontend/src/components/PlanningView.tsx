'use client';

import { motion } from 'framer-motion';

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

interface PlanningData {
  planning_draft?: {
    total_pages?: number;
    style?: string;
    pages: PlanningPage[];
  };
}

interface PlanningViewProps {
  planning: PlanningData;
  onConfirm: () => void;
  onRefinePage: (pageNumber: number, feedback: string) => void;
}

export default function PlanningView({ planning, onConfirm, onRefinePage }: PlanningViewProps) {
  const data = planning.planning_draft || planning;
  const pages: PlanningPage[] = Array.isArray(data.pages) ? data.pages : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">策划稿</h2>
        {data.style && (
          <span className="text-xs text-slate-400">{data.style}</span>
        )}
      </div>

      {/* 逐页卡片 */}
      <div className="grid gap-4">
        {pages.map((page) => (
          <motion.div
            key={page.page_number}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: page.page_number * 0.05 }}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-md mr-2">
                  P{page.page_number}
                </span>
                <span className="text-sm font-semibold text-slate-800">{page.title}</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full whitespace-nowrap">
                {page.visual_type}
              </span>
            </div>

            {/* 目标 */}
            <p className="text-xs text-slate-500 mb-2">{page.goal}</p>

            {/* 核心信息 */}
            <div className="mb-2">
              <div className="text-xs font-medium text-slate-600 mb-1">核心信息</div>
              <ul className="space-y-0.5">
                {page.core_messages.map((msg, i) => (
                  <li key={i} className="text-xs text-slate-500 pl-3 relative before:content-['→'] before:absolute before:left-0 before:text-primary-400">
                    {msg}
                  </li>
                ))}
              </ul>
            </div>

            {/* 关键词 */}
            {page.keywords && page.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {page.keywords.map((kw, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* 布局方向 */}
            {page.layout_direction && (
              <p className="text-xs text-slate-400 italic">{page.layout_direction}</p>
            )}

            {/* 修改按钮 */}
            <button
              onClick={() => {
                const feedback = prompt(`修改第 ${page.page_number} 页的意见：`);
                if (feedback) onRefinePage(page.page_number, feedback);
              }}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              修改此页
            </button>
          </motion.div>
        ))}
      </div>

      {/* 确认按钮 */}
      <div className="pt-2">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          确认策划稿，开始渲染
        </button>
      </div>
    </motion.div>
  );
}
