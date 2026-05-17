'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, X } from 'lucide-react';

interface OutlinePanelProps {
  outline: Record<string, unknown> | null;
  isLoading: boolean;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
  onConfirm: () => void;
  onGoBack: () => void;
}

export default function OutlinePanel({ outline, isLoading, onGenerate, onRefine, onConfirm, onGoBack }: OutlinePanelProps) {
  const [editingTarget, setEditingTarget] = useState<string | null>(null); // null | 'all' | 'page-3'
  const [feedback, setFeedback] = useState('');

  // 正在生成
  if (!outline) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">PPT 大纲</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">正在生成大纲...</p>
        </div>
      </div>
    );
  }

  const data = (outline as { ppt_outline?: Record<string, unknown> }).ppt_outline || outline;
  const parts = (data as Record<string, unknown>).parts as { part_title: string; part_goal: string; pages: { title: string; goal: string; key_points?: string[]; suggested_visual?: string; page_number?: number }[] }[] | undefined;
  const cover = (data as Record<string, unknown>).cover as { title: string; sub_title?: string } | undefined;
  const endPage = (data as Record<string, unknown>).end_page as { title: string; key_takeaways?: string[] } | undefined;

  // 如果解析失败（只有 raw 字段），显示重试
  const hasContent = !!(parts && parts.length > 0);
  if (!hasContent) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">PPT 大纲</h2>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-700 mb-3">大纲数据格式异常，请重新生成</p>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '生成中...' : '重新生成大纲'}
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    let finalFeedback = feedback.trim();
    if (editingTarget && editingTarget.startsWith('page-')) {
      const pageNum = editingTarget.replace('page-', '');
      finalFeedback = `请修改第 ${pageNum} 页：${finalFeedback}`;
    }
    onRefine(finalFeedback);
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
          <h2 className="text-lg font-semibold text-slate-800">PPT 大纲</h2>
          {(data as Record<string, unknown>).total_pages ? (
            <span className="text-xs text-slate-400">共 {String((data as Record<string, unknown>).total_pages)} 页</span>
          ) : null}
        </div>
        <button
          onClick={() => { setEditingTarget('all'); setFeedback(''); }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
        >
          <Pencil size={12} />
          修改整体大纲
        </button>
      </div>

      {(data as Record<string, unknown>).narrative_flow ? (
        <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg italic">{String((data as Record<string, unknown>).narrative_flow)}</p>
      ) : null}

      {/* 整体修改区域 */}
      {editingTarget === 'all' && (
        <EditBox
          label="修改整体大纲"
          placeholder="例如：增加一个竞品对比章节，把总结页拆成两页..."
          feedback={feedback}
          setFeedback={setFeedback}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={() => setEditingTarget(null)}
        />
      )}

      {/* 大纲内容 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* 封面 */}
        {cover && (
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <div className="text-xs font-medium text-primary-600 mb-1">封面</div>
            <div className="text-base font-semibold text-slate-800">{cover.title}</div>
            {cover.sub_title && <div className="text-sm text-slate-500 mt-0.5">{cover.sub_title}</div>}
          </div>
        )}

        {/* 各章节 */}
        {parts?.map((part, pIdx) => (
          <div key={pIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="text-sm font-semibold text-slate-700">{part.part_title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{part.part_goal}</div>
            </div>
            <div className="divide-y divide-slate-50">
              {part.pages.map((page, pgIdx) => {
                const pageNum = page.page_number || pgIdx + 1;
                const isEditingThis = editingTarget === `page-${pageNum}`;

                return (
                  <div key={pgIdx} className="px-4 py-3 group">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">P{pageNum}</span>
                      <span className="text-sm font-medium text-slate-700 flex-1">{page.title}</span>
                      {page.suggested_visual && (
                        <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{page.suggested_visual}</span>
                      )}
                      <button
                        onClick={() => { setEditingTarget(`page-${pageNum}`); setFeedback(''); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-all"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 ml-7">{page.goal}</div>
                    {page.key_points && (
                      <ul className="mt-1.5 ml-7 space-y-0.5">
                        {page.key_points.map((kp, kIdx) => (
                          <li key={kIdx} className="text-xs text-slate-400">· {kp}</li>
                        ))}
                      </ul>
                    )}

                    {/* 单页修改区域 */}
                    {isEditingThis && (
                      <div className="mt-3 ml-7">
                        <EditBox
                          label={`修改第 ${pageNum} 页`}
                          placeholder="例如：这页要加入具体的数据对比表格..."
                          feedback={feedback}
                          setFeedback={setFeedback}
                          isLoading={isLoading}
                          onSubmit={handleSubmit}
                          onCancel={() => setEditingTarget(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 结尾页 */}
        {endPage && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs font-medium text-slate-500 mb-1">结尾</div>
            <div className="font-medium text-slate-700">{endPage.title}</div>
            {endPage.key_takeaways && (
              <ul className="mt-1.5 space-y-0.5">
                {endPage.key_takeaways.map((t, i) => (
                  <li key={i} className="text-xs text-slate-500">· {t}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </motion.div>

      {/* 底部确认按钮 */}
      <div className="sticky bottom-0 bg-surface-secondary pt-4 pb-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          确认大纲，生成策划稿
        </button>
      </div>
    </div>
  );
}

// 内联编辑框组件
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
      exit={{ opacity: 0, height: 0 }}
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
