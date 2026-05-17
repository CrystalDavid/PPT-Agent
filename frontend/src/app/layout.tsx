import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PPT Agent - AI 演示文稿助手',
  description: '通过 AI 对话，从模糊想法到专业 PPT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-surface-secondary antialiased">
        {children}
      </body>
    </html>
  );
}
