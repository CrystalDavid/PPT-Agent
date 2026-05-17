'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, X } from 'lucide-react';

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
  onGenerate: () => void;
  onRefinePage: (pageNumber: number, feedback: string) => void;
  onRefineAll: (feedback: string) => void;
  onConfirm: () => void;
  onGoBack: () => void;
}

export default function PlanningPanel({ planning, isLoading, onGenerate, onRefinePage, onRefineAll, onConfirm, onGoBack }: PlanningPanelProps) {
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  if (!planning) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">策划稿</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">正在生成策划稿...</p>
        </div>
      </div>
    );
  }

  const data = (planning as { planning_draft?: { pages: PlanningPage[]; style?: string } }).planning_draft || planning;
  const pages: PlanningPage[] = Array.isArray((data as Record<string, unknown>).pages) ? (data as { pages: PlanningPage[] }).pages : [];
  const style = (data as { style?: string }).style || '';

  // 如果解析失败（pages 为空），显示重试
  if (pages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">策划稿</h2>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-700 mb-3">策划稿数据格式异常，请重新生成</p>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '生成中...' : '重新生成策划稿'}
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    if (editingTarget === 'all') {
      onRefineAll(feedback.trim());
    } else if (editingTarget?.startsWith('page-')) {
      const pageNum = parseInt(editingTarget.replace('page-', ''));
      onRefinePage(pageNum, feedback.trim());
    }
    setFeedback('');
    setEditingTarget(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">策划稿</h2>
          <span className="text-xs text-slate-400">共 {pages.length} 页</span>
        </div>
        <button
          onClick={() => { setEditingTarget('all'); setFeedback(''); }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
        >
          <Pencil size={12} />
          修改整体策划
        </button>
      </div>

      {style && (
        <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">{style}</p>
      )}

      {/* 整体修改区域 */}
      {editingTarget === 'all' && (
        <EditBox
          label="修改整体策划稿"
          placeholder="例如：每页的核心信息再精简一些，视觉类型多用数据图表..."
          feedback={feedback}
          setFeedback={setFeedback}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={() => setEditingTarget(null)}
        />
      )}

      {/* 逐页卡片 */}
      <div className="grid gap-4">
        {pages.map((page) => {
          const isEditingThis = editingTarget === `page-${page.page_number}`;

          return (
            <motion.div
              key={page.page_number}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: page.page_number * 0.03 }}
              className="bg-white border border-slate-200 rounded-xl p-4 group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded">P{page.page_number}</span>
                  <span className="text-sm font-semibold text-slate-800">{page.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full shrink-0">{page.visual_type}</span>
                  <button
                    onClick={() => { setEditingTarget(`page-${page.page_number}`); setFeedback(''); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-all"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
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

              {/* 单页修改区域 */}
              {isEditingThis && (
                <div className="mt-3">
                  <EditBox
                    label={`修改第 ${page.page_number} 页`}
                    placeholder="例如：这页的视觉类型改成时间线..."
                    feedback={feedback}
                    setFeedback={setFeedback}
                    isLoading={isLoading}
                    onSubmit={handleSubmit}
                    onCancel={() => setEditingTarget(null)}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 确认按钮 */}
      <div className="sticky bottom-0 bg-surface-secondary pt-4 pb-2">
        <button
          onClick={onConfirm}
          disabled={isLoading || pages.length === 0}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          确认策划稿，开始渲染
        </button>
      </div>
    </div>
  );
}

function EditBox({ label, placeholder, feedback, setFeedback, isLoading, onSubmit, onCancel }: {
  label: string;
  placeholder: string;
  feedback: string;
  setFeedback: (v: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-white rounded-lg border border-primary-200 p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary-700">{label}</span>
        <button onClick={onCancel} className="p-0.5 rounded hover:bg-slate-100 text-slate-400">
          <X size={14} />
        </button>
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full h-16 px-2.5 py-2 text-sm border border-slate-200 rounded-lg resize-none outline-none focus:border-primary-400 transition-colors"
      />
      <button
        onClick={onSubmit}
        disabled={isLoading || !feedback.trim()}
        className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? '修改中...' : '提交'}
      </button>
    </motion.div>
  );
}
