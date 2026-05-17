'use client';

import { motion } from 'framer-motion';
import type { WorkflowStage } from '@/app/page';

const milestones: { key: WorkflowStage; label: string }[] = [
  { key: 'interview', label: '需求访谈' },
  { key: 'outline', label: '大纲生成' },
  { key: 'planning', label: '策划稿' },
  { key: 'render', label: '页面渲染' },
  { key: 'export', label: '导出交付' },
];

export default function MilestoneBar({ currentStage }: { currentStage: WorkflowStage }) {
  const currentIdx = milestones.findIndex((m) => m.key === currentStage);

  return (
    <div className="flex items-center justify-center gap-2 py-4 px-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      {milestones.map((m, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;

        return (
          <div key={m.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <motion.div
                className={`w-2.5 h-2.5 rounded-full ${
                  isActive
                    ? 'bg-primary-600'
                    : isDone
                    ? 'bg-primary-300'
                    : 'bg-slate-200'
                }`}
                animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-primary-700' : isDone ? 'text-primary-400' : 'text-slate-400'
                }`}
              >
                {m.label}
              </span>
            </div>
            {idx < milestones.length - 1 && (
              <div className={`w-8 h-px ${isDone ? 'bg-primary-300' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
