import React from 'react';
import { motion } from 'motion/react';
import { Mail, Github, Twitter } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-12"
    >
      <header className="flex flex-col gap-4 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
          关于我
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl">
          了解更多关于作者的信息。
        </p>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none text-text-secondary">
        <p>
          你好！我是 WineryBlog 的作者。我是一个热爱技术、喜欢探索新事物的开发者。
          这个博客主要用来记录我的学习笔记、技术教程以及一些生活随笔。
        </p>
        
        <h2 className="text-2xl font-bold text-text-primary mt-8 mb-4">技术栈</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>前端：</strong> React, Vue, TypeScript, Tailwind CSS</li>
          <li><strong>后端：</strong> Node.js, Python, Go</li>
          <li><strong>其他：</strong> AI Agent, 深度学习, Linux</li>
        </ul>

        <h2 className="text-2xl font-bold text-text-primary mt-8 mb-4">联系方式</h2>
        <div className="flex flex-col gap-4 mt-4">
          <a href="mailto:hello@example.com" className="flex items-center gap-3 text-text-secondary hover:text-accent transition-colors">
            <Mail className="w-5 h-5" />
            <span>hello@example.com</span>
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-text-secondary hover:text-accent transition-colors">
            <Github className="w-5 h-5" />
            <span>GitHub</span>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-text-secondary hover:text-accent transition-colors">
            <Twitter className="w-5 h-5" />
            <span>Twitter</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
};
