'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  Download,
  FileSearch,
  LayoutGrid,
  ListTree,
  MessageSquareText,
  MonitorPlay,
} from 'lucide-react';
import type { WorkflowStage } from '@/app/page';

interface StepConfig {
  key: WorkflowStage;
  label: string;
  icon: LucideIcon;
  tone: string;
  activeTone: string;
}

const steps: StepConfig[] = [
  {
    key: 'interview',
    label: '需求访谈',
    icon: MessageSquareText,
    tone: 'bg-blue-50 text-blue-600 ring-blue-100',
    activeTone: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'brief',
    label: '调研底稿',
    icon: FileSearch,
    tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    activeTone: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'outline',
    label: '大纲',
    icon: ListTree,
    tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    activeTone: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'planning',
    label: '策划稿',
    icon: LayoutGrid,
    tone: 'bg-violet-50 text-violet-600 ring-violet-100',
    activeTone: 'bg-violet-50 text-violet-700',
  },
  {
    key: 'render',
    label: 'SVG 预览',
    icon: MonitorPlay,
    tone: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
    activeTone: 'bg-cyan-50 text-cyan-700',
  },
  {
    key: 'export',
    label: '导出交付',
    icon: Download,
    tone: 'bg-rose-50 text-rose-600 ring-rose-100',
    activeTone: 'bg-rose-50 text-rose-700',
  },
];

interface SidebarProps {
  currentStage: WorkflowStage;
  activePanel: WorkflowStage;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onStageClick: (stage: WorkflowStage) => void;
  hasBrief: boolean;
  hasOutline: boolean;
  hasPlanning: boolean;
  hasRender: boolean;
}

const jump = {
  rest: { y: 0 },
  hover: {
    y: [0, -10, 4, -8, 0],
    transition: { duration: 0.58, ease: 'easeOut' },
  },
};

const textJump = {
  rest: { y: 0 },
  hover: {
    y: [0, -5, 2, -4, 0],
    transition: { duration: 0.52, ease: 'easeOut' },
  },
};

export default function Sidebar({
  currentStage,
  activePanel,
  collapsed,
  onToggleCollapsed,
  onStageClick,
  hasBrief,
  hasOutline,
  hasPlanning,
  hasRender,
}: SidebarProps) {
  const [brandHover, setBrandHover] = useState(false);
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
    return idx >= 0 && idx < currentIdx;
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white"
    >
      <div className={`relative flex items-center ${collapsed ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            onMouseEnter={() => setBrandHover(true)}
            onMouseLeave={() => setBrandHover(false)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white shadow-sm transition-all hover:bg-blue-600"
            title="展开侧边栏"
          >
            {brandHover ? <span className="text-base">▶</span> : 'P'}
          </button>
        ) : (
          <>
            <div>
              <h1 className="text-lg font-black leading-tight text-slate-900">PPT Agent</h1>
              <p className="mt-1 text-xs font-medium text-slate-400">v2026.6.1</p>
            </div>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="absolute -right-3 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-400 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
              title="收起侧边栏"
            >
              ◀
            </button>
          </>
        )}
      </div>

      <nav className={`flex-1 space-y-2 ${collapsed ? 'px-3 py-2' : 'px-4 py-3'}`}>
        {steps.map((step) => {
          const Icon = step.icon;
          const active = activePanel === step.key;
          const unlocked = isUnlocked(step.key);
          const done = isDone(step.key);

          return (
            <motion.button
              key={step.key}
              type="button"
              initial="rest"
              whileHover={unlocked ? 'hover' : 'rest'}
              onClick={() => unlocked && onStageClick(step.key)}
              disabled={!unlocked}
              title={collapsed ? step.label : undefined}
              className={`relative flex w-full items-center rounded-2xl text-left transition-all ${
                collapsed ? 'h-12 justify-center' : 'gap-3 px-3 py-3'
              } ${
                active
                  ? `${step.activeTone} shadow-sm`
                  : unlocked
                    ? 'text-slate-600 hover:bg-slate-50'
                    : 'cursor-not-allowed text-slate-300'
              }`}
            >
              <motion.span
                variants={jump}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${
                  unlocked ? step.tone : 'bg-slate-50 text-slate-300 ring-slate-100'
                }`}
              >
                <Icon size={19} />
              </motion.span>

              {!collapsed && (
                <motion.span variants={textJump} className="text-sm font-semibold">
                  {step.label}
                </motion.span>
              )}

              {done && !collapsed && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={13} />
                </span>
              )}

              {done && collapsed && (
                <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </motion.button>
          );
        })}
      </nav>
    </motion.aside>
  );
}
