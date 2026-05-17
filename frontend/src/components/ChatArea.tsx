'use client';

import { motion } from 'framer-motion';
import type { Message } from '@/app/page';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatArea({ messages, isLoading }: ChatAreaProps) {
  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm'
            }`}
          >
            {msg.content}
          </div>
        </motion.div>
      ))}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
