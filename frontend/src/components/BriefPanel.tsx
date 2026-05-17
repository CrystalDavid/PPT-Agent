'use client';

import { motion } from 'framer-motion';

interface BriefPanelProps {
  brief: Record<string, unknown> | null;
  outline: Record<string, unknown> | null;
  isLoading: boolean;
  onGenerateOutline: () => void;
  onRefineOutline: (feedback: string) => void;
  onConfirmOutline: () => void;
}

export default function BriefPanel({ brief, outline, isLoading, onGenerateOutline, onRefineOutline, onConfirmOutline }: BriefPanelProps) {
  const briefData = (brief as { research_brief?: Record<string, unknown> })?.research_brief || brief;
  const outlineData = (outline as { ppt_outline?: Record<string, unknown> })?.ppt_outline || outline;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 调研底稿 */}
      {briefData && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">调研底稿</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <InfoRow label="主题" value={briefData.topic_summary} />
            <InfoRow label="受众" value={briefData.audience} />
            <InfoRow label="目的" value={briefData.purpose} />
            <InfoRow label="场景" value={briefData.scene} />
            <InfoRow label="时间" value={briefData.time_limit} />
            <InfoRow label="页数" value={briefData.page_count} />
            <InfoRow label="风格" value={briefData.style_suggestion} />

            {Array.isArray(briefData.core_highlights) && (
              <div>
                <span className="text-xs font-medium text-slate-500">核心亮点</span>
                <ul className="mt-1 space-y-1">
                  {(briefData.core_highlights as string[]).map((h, i) => (
                    <li key={i} className="text-sm text-slate-700 pl-3 border-l-2 border-primary-300">{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(briefData.recommended_sections) && (
              <div>
                <span className="text-xs font-medium text-slate-500">建议章节</span>
                <div className="mt-2 grid gap-2">
                  {(briefData.recommended_sections as { title: string; goal: string; priority: string }[]).map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        s.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
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
          </div>

          {!outline && (
            <button
              onClick={onGenerateOutline}
              disabled={isLoading}
              className="mt-4 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '生成中...' : '确认底稿，生成大纲'}
            </button>
          )}
        </motion.section>
      )}

      {/* 大纲 */}
      {outlineData && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">PPT 大纲</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            {/* 封面 */}
            {(outlineData as Record<string, unknown>).cover && (
              <div className="p-3 bg-primary-50 rounded-lg">
                <div className="text-xs text-primary-600 font-medium">封面</div>
                <div className="text-base font-semibold text-slate-800 mt-1">{String(((outlineData as Record<string, unknown>).cover as Record<string, unknown>)?.title || '')}</div>
                {((outlineData as Record<string, unknown>).cover as Record<string, unknown>)?.sub_title && (
                  <div className="text-sm text-slate-500">{String(((outlineData as Record<string, unknown>).cover as Record<string, unknown>).sub_title)}</div>
                )}
              </div>
            )}

            {/* 章节 */}
            {Array.isArray((outlineData as Record<string, unknown>).parts) && (
              ((outlineData as Record<string, unknown>).parts as { part_title: string; part_goal: string; pages: { title: string; goal: string; key_points?: string[]; suggested_visual?: string; page_number?: number }[] }[]).map((part, pIdx) => (
                <div key={pIdx} className="border border-slate-100 rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50">
                    <div className="text-sm font-semibold text-slate-700">{part.part_title}</div>
                    <div className="text-xs text-slate-400">{part.part_goal}</div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {part.pages.map((page, pgIdx) => (
                      <div key={pgIdx} className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">P{page.page_number || pgIdx + 1}</span>
                          <span className="text-sm font-medium text-slate-700">{page.title}</span>
                          {page.suggested_visual && (
                            <span className="ml-auto text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{page.suggested_visual}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 ml-7">{page.goal}</div>
                        {page.key_points && (
                          <ul className="mt-1 ml-7 space-y-0.5">
                            {page.key_points.map((kp, kIdx) => (
                              <li key={kIdx} className="text-xs text-slate-400">· {kp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onConfirmOutline}
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              确认大纲，生成策划稿
            </button>
            <button
              onClick={() => {
                const feedback = prompt('请输入修改意见：');
                if (feedback) onRefineOutline(feedback);
              }}
              disabled={isLoading}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              修改大纲
            </button>
          </div>
        </motion.section>
      )}
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
