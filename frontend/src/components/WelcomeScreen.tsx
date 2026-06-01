'use client';

import { motion } from 'framer-motion';
import { FileUp, Presentation, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  isImporting: boolean;
  onStartNew: () => void;
  onImport: () => void;
}

export default function WelcomeScreen({ isImporting, onStartNew, onImport }: WelcomeScreenProps) {
  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Sparkles size={30} />
          </div>
          <h1 className="text-4xl font-black tracking-normal text-slate-900">PPT Agent</h1>
          <p className="mt-2 text-sm font-medium text-slate-400">v2026.6.1</p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
            从需求访谈到可编辑 PPTX，一次完成策划、SVG 设计预览和导出交付。
          </p>
        </motion.div>

        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          <motion.button
            type="button"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartNew}
            className="group rounded-3xl border border-blue-100 bg-white p-8 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100"
          >
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <Presentation size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">开启新的 PPT 设计</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              从访谈开始，让 AI 帮你逐步生成底稿、大纲、策划稿和可编辑 PPT。
            </p>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onImport}
            disabled={isImporting}
            className="group rounded-3xl border border-emerald-100 bg-white p-8 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <FileUp size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">导入旧的 PPT 设计</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              选择之前导出的 .pptagent.json，会恢复访谈、策划稿、SVG 页面和导出状态。
            </p>
          </motion.button>
        </div>
      </div>
    </main>
  );
}
