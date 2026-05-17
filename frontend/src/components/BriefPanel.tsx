'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface BriefPanelProps {
  brief: Record<string, unknown> | null;
  isLoading: boolean;
  onConfirm: () => void;
  onRefine: (feedback: string) => void;
  onGoBack: () => void;
}

export default function BriefPanel({ brief, isLoading, onConfirm, onRefine, onGoBack }: BriefPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
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
        <h2 className="text-lg font-semibold text-slate-800">调研底稿</h2>
      </div>

      {/* 底稿内容 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <InfoRow label="主题" value={data.topic_summary} />
        <InfoRow label="受众" value={data.audience} />
        <InfoRow label="目的" value={data.purpose} />
        <InfoRow label="场景" value={data.scene} />
        <InfoRow label="时间" value={data.time_limit} />
        <InfoRow label="页数" value={data.page_count} />
        <InfoRow label="风格" value={data.style_suggestion} />
        <InfoRow label="素材" value={data.available_materials} />

        {Array.isArray(data.core_highlights) && (
          <div>
            <span className="text-xs font-medium text-slate-500">核心亮点</span>
            <ul className="mt-1 space-y-1">
              {(data.core_highlights as string[]).map((h, i) => (
                <li key={i} className="text-sm text-slate-700 pl-3 border-l-2 border-primary-300">{h}</li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(data.recommended_sections) && (
          <div>
            <span className="text-xs font-medium text-slate-500">建议章节</span>
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
          </div>
        )}

        {Array.isArray(data.risks_and_gaps) && (data.risks_and_gaps as string[]).length > 0 && (
          <div>
            <span className="text-xs font-medium text-slate-500">风险与缺口</span>
            <ul className="mt-1 space-y-1">
              {(data.risks_and_gaps as string[]).map((r, i) => (
                <li key={i} className="text-xs text-orange-600 pl-3 border-l-2 border-orange-200">{r}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* 修改区域 */}
      {isEditing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-xl border border-primary-200 p-4 space-y-3">
          <p className="text-sm text-slate-600">请描述你想修改的内容，AI 会据此调整底稿：</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="例如：受众不只是新生，还有家长。页数不限制，要覆盖所有专业..."
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
          确认底稿，进入大纲
        </button>
        <button
          onClick={() => setIsEditing(true)}
          disabled={isLoading || isEditing}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          修改底稿
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-xs font-medium text-slate-500 w-10 shrink-0">{label}</span>
      <span className="text-sm text-slate-700">{String(value)}</span>
    </div>
  );
}
