'use client';

import { motion } from 'framer-motion';

interface BriefCardProps {
  brief: Record<string, unknown>;
  onConfirm: () => void;
}

export default function BriefCard({ brief, onConfirm }: BriefCardProps) {
  const data = (brief as { research_brief?: Record<string, unknown> }).research_brief || brief;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-5 bg-white border border-primary-200 rounded-2xl shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <h3 className="text-sm font-semibold text-slate-700">调研底稿已生成</h3>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        {data.topic_summary && (
          <p><span className="font-medium text-slate-700">主题：</span>{String(data.topic_summary)}</p>
        )}
        {data.audience && (
          <p><span className="font-medium text-slate-700">受众：</span>{String(data.audience)}</p>
        )}
        {data.purpose && (
          <p><span className="font-medium text-slate-700">目的：</span>{String(data.purpose)}</p>
        )}
        {data.scene && (
          <p><span className="font-medium text-slate-700">场景：</span>{String(data.scene)}</p>
        )}
        {data.style_suggestion && (
          <p><span className="font-medium text-slate-700">风格建议：</span>{String(data.style_suggestion)}</p>
        )}
        {Array.isArray(data.core_highlights) && (
          <div>
            <span className="font-medium text-slate-700">核心亮点：</span>
            <ul className="list-disc list-inside ml-2 mt-1">
              {(data.core_highlights as string[]).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(data.recommended_sections) && (
          <div>
            <span className="font-medium text-slate-700">建议章节：</span>
            <ul className="list-disc list-inside ml-2 mt-1">
              {(data.recommended_sections as { title: string; goal: string }[]).map((s, i) => (
                <li key={i}><span className="font-medium">{s.title}</span> — {s.goal}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={onConfirm}
        className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
      >
        确认底稿，生成大纲
      </button>
    </motion.div>
  );
}
