'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'request' | 'response' | 'info' | 'error';
  content: string;
}

interface AiLogPanelProps {
  logs: LogEntry[];
}

export default function AiLogPanel({ logs }: AiLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastLog = logs[logs.length - 1];
    if (lastLog?.type === 'error') setIsOpen(true);
  }, [logs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <>
      {!isOpen && (
        <motion.button
          type="button"
          onClick={() => setIsOpen(true)}
          animate={{ x: [0, -4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="fixed right-3 top-1/2 z-30 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="展开 AI 日志"
        >
          <ChevronLeft size={20} strokeWidth={2.4} />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="z-20 flex h-screen shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
          >
            <div className="flex h-24 shrink-0 items-center justify-between px-6">
              <span className="text-2xl font-semibold text-slate-900">AI 日志</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="收起日志"
              >
                <ChevronRight size={20} strokeWidth={2.4} />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
              {logs.length === 0 ? (
                <p className="mt-8 text-center text-xs text-slate-400">暂无日志</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-2xl p-3 text-xs ${
                      log.type === 'request' ? 'bg-blue-50 text-blue-700' :
                      log.type === 'response' ? 'bg-slate-50 text-slate-600' :
                      log.type === 'error' ? 'bg-red-50 text-red-600' :
                      'bg-green-50 text-green-700'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        log.type === 'request' ? 'bg-blue-400' :
                        log.type === 'response' ? 'bg-slate-400' :
                        log.type === 'error' ? 'bg-red-400' :
                        'bg-green-400'
                      }`} />
                      <span className="font-medium">
                        {log.type === 'request' ? '请求' : log.type === 'response' ? '响应' : log.type === 'error' ? '错误' : '信息'}
                      </span>
                      <span className="ml-auto text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
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
