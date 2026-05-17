'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelRightClose, PanelRightOpen, X } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'info' | 'error';
  content: string;
}

interface AiLogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export default function AiLogPanel({ logs, onClear }: AiLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 有错误时自动展开面板
  useEffect(() => {
    const lastLog = logs[logs.length - 1];
    if (lastLog?.type === 'error') {
      setIsOpen(true);
    }
  }, [logs]);

  // 新日志时自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <>
      {/* 展开按钮（右侧边缘） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-white border border-r-0 border-slate-200 rounded-l-lg shadow-sm hover:bg-slate-50 transition-colors"
          title="查看 AI 日志"
        >
          <PanelRightOpen size={16} className="text-slate-500" />
        </button>
      )}

      {/* 右侧面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-screen border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0 z-20"
          >
            {/* 头部 */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
              <span className="text-sm font-semibold text-slate-700">AI 输出日志</span>
              <div className="flex items-center gap-1">
                {logs.length > 0 && (
                  <button onClick={onClear} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-50">
                    清空
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <PanelRightClose size={16} />
                </button>
              </div>
            </div>

            {/* 日志列表 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-8">暂无日志</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={`text-xs p-2 rounded-lg ${
                    log.type === 'request' ? 'bg-blue-50 text-blue-700' :
                    log.type === 'response' ? 'bg-slate-50 text-slate-600' :
                    log.type === 'error' ? 'bg-red-50 text-red-600' :
                    'bg-green-50 text-green-700'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        log.type === 'request' ? 'bg-blue-400' :
                        log.type === 'response' ? 'bg-slate-400' :
                        log.type === 'error' ? 'bg-red-400' :
                        'bg-green-400'
                      }`} />
                      <span className="font-medium">
                        {log.type === 'request' ? '请求' : log.type === 'response' ? '响应' : log.type === 'error' ? '错误' : '信息'}
                      </span>
                      <span className="text-slate-400 ml-auto">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{log.content}</p>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
