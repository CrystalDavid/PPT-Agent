'use client';

import { motion } from 'framer-motion';
import type { WorkflowStage } from '@/app/page';
import { FileText, ClipboardList, List, LayoutGrid, Monitor, Download } from 'lucide-react';

const steps: { key: WorkflowStage; label: string; icon: typeof FileText }[] = [
  { key: 'interview', label: '需求访谈', icon: FileText },
  { key: 'brief', label: '调研底稿', icon: ClipboardList },
  { key: 'outline', label: '大纲', icon: List },
  { key: 'planning', label: '策划稿', icon: LayoutGrid },
  { key: 'render', label: '页面渲染', icon: Monitor },
  { key: 'export', label: '导出交付', icon: Download },
];

interface SidebarProps {
  currentStage: WorkflowStage;
  activePanel: WorkflowStage;
  onStageClick: (stage: WorkflowStage) => void;
  hasBrief: boolean;
  hasOutline: boolean;
  hasPlanning: boolean;
  hasRender: boolean;
}

export default function Sidebar({
  currentStage,
  activePanel,
  onStageClick,
  hasBrief,
  hasOutline,
  hasPlanning,
  hasRender,
}: SidebarProps) {
  const stageOrder: WorkflowStage[] = ['interview', 'brief', 'outline', 'planning', 'render', 'export'];
  const currentIdx = stageOrder.indexOf(currentStage);

  const isUnlocked = (key: WorkflowStage) => {
    switch (key) {
      case 'interview': return true;
      case 'brief': return hasBrief;
      case 'outline': return hasBrief;
      case 'planning': return hasOutline;
      case 'render': return hasPlanning;
      case 'export': return hasRender;
    }
  };

  const isDone = (key: WorkflowStage) => {
    const idx = stageOrder.indexOf(key);
    return idx < currentIdx;
  };

  return (
    <aside className="w-56 bg-white border-r border-slate-100 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-800">PPT Agent</h1>
        <p className="text-xs text-slate-400 mt-0.5">AI 演示文稿助手</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const active = activePanel === step.key;
          const unlocked = isUnlocked(step.key);
          const done = isDone(step.key);

          return (
            <button
              key={step.key}
              onClick={() => unlocked && onStageClick(step.key)}
              disabled={!unlocked}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all relative ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : unlocked
                  ? 'text-slate-600 hover:bg-slate-50'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              {idx < steps.length - 1 && (
                <div className={`absolute left-[22px] top-[38px] w-px h-4 ${done ? 'bg-primary-300' : 'bg-slate-200'}`} />
              )}

              <div className={`w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
                active ? 'text-primary-600' : done ? 'text-primary-400' : 'text-slate-300'
              }`}>
                <Icon size={16} />
              </div>

              <span className={`text-sm font-medium ${active ? 'text-primary-700' : ''}`}>
                {step.label}
              </span>

              {done && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">可点击已完成步骤返回修改</p>
      </div>
    </aside>
  );
}
