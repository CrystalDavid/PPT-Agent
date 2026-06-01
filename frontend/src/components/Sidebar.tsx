'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  Download,
  FileSearch,
  Home,
  LayoutGrid,
  ListTree,
  MessageSquareText,
  MonitorPlay,
  PanelLeftClose,
} from 'lucide-react';
import type { WorkflowStage } from '@/app/page';

interface StepConfig {
  key: WorkflowStage;
  label: string;
  icon: LucideIcon;
  color: string;
  mutedColor: string;
  active: string;
}

const steps: StepConfig[] = [
  { key: 'interview', label: '需求访谈', icon: MessageSquareText, color: 'text-sky-600', mutedColor: 'text-sky-300', active: 'bg-sky-50 text-sky-700' },
  { key: 'brief', label: '调研底稿', icon: FileSearch, color: 'text-emerald-600', mutedColor: 'text-emerald-300', active: 'bg-emerald-50 text-emerald-700' },
  { key: 'outline', label: '大纲', icon: ListTree, color: 'text-amber-600', mutedColor: 'text-amber-300', active: 'bg-amber-50 text-amber-700' },
  { key: 'planning', label: '策划稿', icon: LayoutGrid, color: 'text-violet-600', mutedColor: 'text-violet-300', active: 'bg-violet-50 text-violet-700' },
  { key: 'render', label: 'SVG 预览', icon: MonitorPlay, color: 'text-cyan-600', mutedColor: 'text-cyan-300', active: 'bg-cyan-50 text-cyan-700' },
  { key: 'export', label: '导出交付', icon: Download, color: 'text-rose-600', mutedColor: 'text-rose-300', active: 'bg-rose-50 text-rose-700' },
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

const iconMotion = {
  rest: { y: 0 },
  hover: {
    y: [0, -4, 2, -3, 0],
    transition: { duration: 0.48, ease: 'easeOut' },
  },
};

const textMotion = {
  rest: { y: 0 },
  hover: {
    y: [0, -3, 0],
    transition: { duration: 0.34, ease: 'easeOut' },
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
      initial={false}
      animate={{ width: collapsed ? 88 : 300 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white"
    >
      <div className={`flex h-24 items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-6'}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            onMouseEnter={() => setBrandHover(true)}
            onMouseLeave={() => setBrandHover(false)}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-semibold text-slate-900 transition-colors hover:bg-slate-100 hover:text-blue-600"
            title="展开侧边栏"
          >
            {brandHover ? <span className="text-3xl leading-none">›</span> : 'P'}
          </button>
        ) : (
          <>
            <div className="min-w-0 whitespace-nowrap">
              <h1 className="text-2xl font-semibold leading-tight text-slate-900">PPT Agent</h1>
              <p className="mt-1 text-sm text-slate-400">v2026.6.1</p>
            </div>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              title="收起侧边栏"
            >
              <PanelLeftClose size={22} strokeWidth={2.1} />
            </button>
          </>
        )}
      </div>

      <nav className={`flex-1 space-y-1.5 ${collapsed ? 'px-3 py-2' : 'px-4 py-2'}`}>
        {steps.map((step) => {
          const Icon = step.icon;
          const active = activePanel === step.key;
          const unlocked = isUnlocked(step.key);
          const done = isDone(step.key);
          const iconColor = unlocked ? step.color : step.mutedColor;

          return (
            <motion.button
              key={step.key}
              type="button"
              initial="rest"
              whileHover={unlocked ? 'hover' : 'rest'}
              onClick={() => unlocked && onStageClick(step.key)}
              disabled={!unlocked}
              title={collapsed ? step.label : undefined}
              className={`relative flex h-11 w-full items-center rounded-full text-left transition-colors ${
                collapsed ? 'justify-center' : 'gap-3 px-4'
              } ${
                active
                  ? step.active
                  : unlocked
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'cursor-not-allowed text-slate-400'
              }`}
            >
              <motion.span variants={iconMotion} className={`flex shrink-0 items-center justify-center ${active ? step.color : iconColor}`}>
                <Icon size={22} strokeWidth={2.05} />
              </motion.span>

              {!collapsed && (
                <motion.span variants={textMotion} className="whitespace-nowrap text-sm font-normal">
                  {step.label}
                </motion.span>
              )}

              {done && !collapsed && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full text-emerald-500">
                  <Check size={13} />
                </span>
              )}
              {done && collapsed && <span className="absolute bottom-2 right-3 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </motion.button>
          );
        })}
      </nav>

      <div className={`${collapsed ? 'px-3' : 'px-4'} pb-5`}>
        <a
          href="https://crystaldavid.github.io/"
          className={`group flex h-11 items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 ${
            collapsed ? 'justify-center' : 'gap-3 px-4'
          }`}
          title="返回主页"
        >
          <Home size={21} strokeWidth={2.05} />
          {!collapsed && <span className="whitespace-nowrap text-sm font-normal">主页</span>}
        </a>
      </div>
    </motion.aside>
  );
}
