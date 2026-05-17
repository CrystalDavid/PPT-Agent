'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface OutlinePanelProps {
  outline: Record<string, unknown> | null;
  isLoading: boolean;
  onGenerate: () => void;
  onRefine: (feedback: string) => void;
  onConfirm: () => void;
  onGoBack: () => void;
}

export default function OutlinePanel({ outline, isLoading, onGenerate, onRefine, onConfirm, onGoBack }: OutlinePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState('');

  // 未生成大纲时显示生成按钮
  if (!outline) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">PPT 大纲</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <p className="mb-4">底稿已确认，可以生成大纲了</p>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? '生成中...' : '生成大纲'}
          </button>
        </div>
      </div>
    );
  }

  const data = (outline as { ppt_outline?: Record<string, unknown> }).ppt_outline || outline;
  const parts = (data as Record<string, unknown>).parts as { part_title: string; part_goal: string; pages: { title: string; goal: string; key_points?: string[]; suggested_visual?: string; page_number?: number }[] }[] | undefined;
  const cover = (data as Record<string, unknown>).cover as { title: string; sub_title?: string } | undefined;
  const endPage = (data as Record<string, unknown>).end_page as { title: string; key_takeaways?: string[] } | undefined;

  const handleSubmitRefine = () => {
    if (!feedback.trim()) return;
    onRefine(feedback.trim());
    setFeedback('');
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">PPT 大纲</h2>
        {(data as Record<string, unknown>).total_pages ? (
          <span className="text-xs text-slate-400">共 {String((data as Record<string, unknown>).total_pages)} 页</span>
        ) : null}
      </div>

      {(data as Record<string, unknown>).narrative_flow ? (
        <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg italic">{String((data as Record<string, unknown>).narrative_flow)}</p>
      ) : null}

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
              {part.pages.map((page, pgIdx) => (
                <div key={pgIdx} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">P{page.page_number || pgIdx + 1}</span>
                    <span className="text-sm font-medium text-slate-700">{page.title}</span>
                    {page.suggested_visual && (
                      <span className="ml-auto text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{page.suggested_visual}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 ml-7">{page.goal}</div>
                  {page.key_points && (
                    <ul className="mt-1.5 ml-7 space-y-0.5">
                      {page.key_points.map((kp, kIdx) => (
                        <li key={kIdx} className="text-xs text-slate-400">· {kp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
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

      {/* 修改区域 */}
      {isEditing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-xl border border-primary-200 p-4 space-y-3">
          <p className="text-sm text-slate-600">请描述你想修改的内容：</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="例如：把第三章拆成两页，增加一个竞品对比的章节..."
            className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none outline-none focus:border-primary-400 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitRefine}
              disabled={isLoading || !feedback.trim()}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '修改中...' : '提交修改'}
            </button>
            <button
              onClick={() => { setIsEditing(false); setFeedback(''); }}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
          </div>
        </motion.div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          确认大纲，生成策划稿
        </button>
        <button
          onClick={() => setIsEditing(true)}
          disabled={isLoading || isEditing}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          修改大纲
        </button>
      </div>
    </div>
  );
}
