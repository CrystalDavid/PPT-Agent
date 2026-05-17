'use client';

import { motion } from 'framer-motion';

interface OutlinePage {
  page_number?: number;
  title: string;
  goal: string;
  key_points?: string[];
  suggested_visual?: string;
}

interface OutlinePart {
  part_title: string;
  part_goal: string;
  pages: OutlinePage[];
}

interface OutlineData {
  ppt_outline?: {
    cover?: { title: string; sub_title?: string };
    parts?: OutlinePart[];
    end_page?: { title: string; key_takeaways?: string[] };
    narrative_flow?: string;
    total_pages?: number;
  };
}

interface OutlineViewProps {
  outline: OutlineData;
  onConfirm: () => void;
  onRefine: (feedback: string) => void;
}

export default function OutlineView({ outline, onConfirm, onRefine }: OutlineViewProps) {
  const data = outline.ppt_outline || outline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">PPT 大纲</h2>
        {data.total_pages && (
          <span className="text-xs text-slate-400">共 {data.total_pages} 页</span>
        )}
      </div>

      {data.narrative_flow && (
        <p className="text-sm text-slate-500 italic">{data.narrative_flow}</p>
      )}

      {/* 封面 */}
      {data.cover && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="text-xs font-medium text-primary-600 mb-1">封面</div>
          <div className="font-semibold text-slate-800">{data.cover.title}</div>
          {data.cover.sub_title && (
            <div className="text-sm text-slate-500 mt-0.5">{data.cover.sub_title}</div>
          )}
        </div>
      )}

      {/* 各章节 */}
      {data.parts?.map((part, pIdx) => (
        <div key={pIdx} className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="font-medium text-slate-700">{part.part_title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{part.part_goal}</div>
          </div>
          <div className="divide-y divide-slate-100">
            {part.pages.map((page, pgIdx) => (
              <div key={pgIdx} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-slate-400 mr-2">P{page.page_number || pgIdx + 1}</span>
                    <span className="text-sm font-medium text-slate-700">{page.title}</span>
                  </div>
                  {page.suggested_visual && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full whitespace-nowrap">
                      {page.suggested_visual}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1">{page.goal}</div>
                {page.key_points && page.key_points.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {page.key_points.map((kp, kIdx) => (
                      <li key={kIdx} className="text-xs text-slate-400 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-300">
                        {kp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 结尾页 */}
      {data.end_page && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-xs font-medium text-slate-500 mb-1">结尾</div>
          <div className="font-medium text-slate-700">{data.end_page.title}</div>
          {data.end_page.key_takeaways && (
            <ul className="mt-1.5 space-y-0.5">
              {data.end_page.key_takeaways.map((t, i) => (
                <li key={i} className="text-xs text-slate-500">• {t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          确认大纲，生成策划稿
        </button>
        <button
          onClick={() => {
            const feedback = prompt('请输入修改意见：');
            if (feedback) onRefine(feedback);
          }}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          修改大纲
        </button>
      </div>
    </motion.div>
  );
}
