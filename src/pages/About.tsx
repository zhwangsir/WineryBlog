import React from 'react';
import { motion } from 'motion/react';
import { Mail, Github, MessageCircle, Globe, ExternalLink } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SEO } from '../components/SEO';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const iconMap: Record<string, React.ElementType> = {
  mail: Mail,
  github: Github,
  qq: MessageCircle,
  globe: Globe,
};

export const About: React.FC = () => {
  const { config } = useData();
  
  const aboutContent = config?.about?.content || `
你好！我是 ${config?.author || 'WineryBlog'} 的作者。

这是一个基于 React + Express + TypeScript 构建的个人博客系统，
主题以《原神》中的角色胡桃为设计灵感。

## 关于这个博客

这个博客主要用于：

- 📝 记录学习笔记
- 💻 分享技术文章  
- 🎮 分享游戏相关内容

## 特色功能

- ✨ 樱花飘落特效
- 🎵 背景音乐播放器
- 🔒 文章加密保护
- 📱 响应式设计

欢迎常来看看！
`;

  const skills = config?.about?.skills || [
    'React / Vue / TypeScript',
    'Node.js / Python / Go',
    'AI Agent / 深度学习',
    'Linux / DevOps'
  ];

  return (
    <>
      <SEO 
        title={`关于我 - ${config?.title || 'WineryBlog'}`}
        description={config?.subtitle || '了解更多关于作者的信息'}
        author={config?.author}
        keywords={['关于', '个人介绍', '技术博客', ...(config?.tags || [])]}
      />
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
            {config?.subtitle || '了解更多关于作者的信息。'}
          </p>
        </header>

        {/* Profile Card */}
        <div className="bg-bg-card rounded-2xl p-8 border border-border">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent/20 shrink-0">
              <img 
                src={config?.profile?.avatar || '/images/HuTao/avatar.Cxp9qlib_DMTcv.png'}
                alt={config?.profile?.name || 'Avatar'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {config?.profile?.name || config?.author || 'Winery'}
              </h2>
              <p className="text-text-secondary mb-4">
                {config?.profile?.bio || '永远相信，美好的事情即将发生。'}
              </p>
              
              {/* Social Links */}
              {config?.social && config.social.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {config.social.map((item) => {
                    const Icon = iconMap[item.platform.toLowerCase()] || Globe;
                    return (
                      <a
                        key={item.platform}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-base border border-border hover:border-accent hover:text-accent transition-all"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm capitalize">{item.platform}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="prose prose-lg dark:prose-invert max-w-none text-text-secondary">
              <Markdown remarkPlugins={[remarkGfm]}>
                {aboutContent}
              </Markdown>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            <div className="bg-bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full" />
                技术栈
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-lg bg-bg-base text-sm text-text-secondary border border-border"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-bg-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full" />
                博客统计
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">文章数</span>
                  <span className="font-medium text-text-primary">{config?.stats?.articles || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">分类数</span>
                  <span className="font-medium text-text-primary">{config?.stats?.categories || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">标签数</span>
                  <span className="font-medium text-text-primary">{config?.stats?.tags || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">总字数</span>
                  <span className="font-medium text-text-primary">{config?.stats?.words || '0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
