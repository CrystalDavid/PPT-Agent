'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, X } from 'lucide-react';

interface BriefPanelProps {
  brief: Record<string, unknown> | null;
  isLoading: boolean;
  onConfirm: () => void;
  onRefine: (feedback: string) => void;
  onGoBack: () => void;
}

export default function BriefPanel({ brief, isLoading, onConfirm, onRefine, onGoBack }: BriefPanelProps) {
  const [editingTarget, setEditingTarget] = useState<string | null>(null); // null | 'all' | field name
  const [feedback, setFeedback] = useState('');

  if (!brief) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-64 text-slate-400">
        <p>调研底稿尚未生成，请先完成访谈</p>
        <button onClick={onGoBack} className="mt-3 text-sm text-primary-600 hover:underline">返回访谈</button>
      </div>
    );
  }

  const data = (brief as { research_brief?: Record<string, unknown> }).research_brief || brief;

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    let finalFeedback = feedback.trim();
    if (editingTarget && editingTarget !== 'all') {
      finalFeedback = `请修改"${editingTarget}"部分：${finalFeedback}`;
    }
    onRefine(finalFeedback);
    setFeedback('');
    setEditingTarget(null);
  };

  const fields: { key: string; label: string; value: unknown }[] = [
    { key: '主题', label: '主题', value: data.topic_summary },
    { key: '受众', label: '受众', value: data.audience },
    { key: '目的', label: '目的', value: data.purpose },
    { key: '场景', label: '场景', value: data.scene },
    { key: '时间', label: '时间', value: data.time_limit },
    { key: '页数', label: '页数', value: data.page_count },
    { key: '风格', label: '风格', value: data.style_suggestion },
    { key: '素材', label: '素材', value: data.available_materials },
  ].filter(f => f.value);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold text-slate-800">调研底稿</h2>
        </div>
        <button
          onClick={() => { setEditingTarget('all'); setFeedback(''); }}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
        >
          <Pencil size={12} />
          修改整体底稿
        </button>
      </div>

      {/* 整体修改区域 */}
      {editingTarget === 'all' && (
        <EditBox
          label="修改整体调研底稿"
          placeholder="例如：受众不只是新生还有家长，页数不限制，要覆盖所有专业..."
          feedback={feedback}
          setFeedback={setFeedback}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          onCancel={() => setEditingTarget(null)}
        />
      )}

      {/* 底稿内容 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        {/* 基础字段 */}
        {fields.map((field) => (
          <div key={field.key} className="flex gap-3 group items-start">
            <span className="text-xs font-medium text-slate-500 w-10 shrink-0 pt-0.5">{field.label}</span>
            <span className="text-sm text-slate-700 flex-1">{String(field.value)}</span>
            <button
              onClick={() => { setEditingTarget(field.key); setFeedback(''); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-all shrink-0"
            >
              <Pencil size={12} />
            </button>
          </div>
        ))}

        {/* 单字段修改 */}
        {editingTarget && editingTarget !== 'all' && fields.some(f => f.key === editingTarget) && (
          <EditBox
            label={`修改"${editingTarget}"`}
            placeholder={`请描述你想怎么修改${editingTarget}...`}
            feedback={feedback}
            setFeedback={setFeedback}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => setEditingTarget(null)}
          />
        )}

        {/* 核心亮点 */}
        {Array.isArray(data.core_highlights) && (
          <div className="group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">核心亮点</span>
              <button
                onClick={() => { setEditingTarget('核心亮点'); setFeedback(''); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-all"
              >
                <Pencil size={12} />
              </button>
            </div>
            <ul className="mt-1 space-y-1">
              {(data.core_highlights as string[]).map((h, i) => (
                <li key={i} className="text-sm text-slate-700 pl-3 border-l-2 border-primary-300">{h}</li>
              ))}
            </ul>
            {editingTarget === '核心亮点' && (
              <div className="mt-2">
                <EditBox label="修改核心亮点" placeholder="例如：增加一个关于性价比的亮点..." feedback={feedback} setFeedback={setFeedback} isLoading={isLoading} onSubmit={handleSubmit} onCancel={() => setEditingTarget(null)} />
              </div>
            )}
          </div>
        )}

        {/* 建议章节 */}
        {Array.isArray(data.recommended_sections) && (
          <div className="group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">建议章节</span>
              <button
                onClick={() => { setEditingTarget('建议章节'); setFeedback(''); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-all"
              >
                <Pencil size={12} />
              </button>
            </div>
            <div className="mt-2 grid gap-2">
              {(data.recommended_sections as { title: string; goal: string; priority: string }[]).map((s, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                    s.priority === 'high' ? 'bg-red-50 text-red-600' : s.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                  }`}>{s.priority}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-700">{s.title}</div>
                    <div className="text-xs text-slate-500">{s.goal}</div>
                  </div>
                </div>
              ))}
            </div>
            {editingTarget === '建议章节' && (
              <div className="mt-2">
                <EditBox label="修改建议章节" placeholder="例如：增加一个避坑指南章节，删掉预算分析..." feedback={feedback} setFeedback={setFeedback} isLoading={isLoading} onSubmit={handleSubmit} onCancel={() => setEditingTarget(null)} />
              </div>
            )}
          </div>
        )}

        {/* 风险 */}
        {Array.isArray(data.risks_and_gaps) && (data.risks_and_gaps as string[]).length > 0 && (
          <div className="group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">风险与缺口</span>
              <button
                onClick={() => { setEditingTarget('风险与缺口'); setFeedback(''); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-all"
              >
                <Pencil size={12} />
              </button>
            </div>
            <ul className="mt-1 space-y-1">
              {(data.risks_and_gaps as string[]).map((r, i) => (
                <li key={i} className="text-xs text-orange-600 pl-3 border-l-2 border-orange-200">{r}</li>
              ))}
            </ul>
            {editingTarget === '风险与缺口' && (
              <div className="mt-2">
                <EditBox label="修改风险与缺口" placeholder="..." feedback={feedback} setFeedback={setFeedback} isLoading={isLoading} onSubmit={handleSubmit} onCancel={() => setEditingTarget(null)} />
              </div>
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
          确认底稿，进入大纲
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
