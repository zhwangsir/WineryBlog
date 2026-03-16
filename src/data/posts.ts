export interface Post {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: string;
  isLocked?: boolean;
  password?: string;
  cover?: string;
  pinned?: boolean;
  views?: number;
}

export const categories = [
  { name: '归档', count: 36, isHome: true },
  { name: '教程', count: 9 },
  { name: '论文阅读', count: 9 },
  { name: '笔记', count: 8 },
  { name: '作业', count: 7 },
  { name: '文章示例', count: 1 },
  { name: '随笔', count: 1 },
  { name: '项目文档', count: 1 },
];

export const tags = [
  '目标检测', 'YOLO', 'RGB-IR', '双流网络', '融合实验', '项目维护',
  'AI Agent', 'Anaconda', 'CVPR', 'C语言', 'Linux', 'macOS', 'Markdown'
];

export const posts: Post[] = [
  {
    id: '1',
    title: '项目笔记 | YOLO26-MultiModal 单模态改双模态',
    date: '2026-03-13',
    category: '项目文档',
    tags: ['目标检测', 'YOLO', 'RGB-IR', '双流网络', '融合实验', '项目维护'],
    excerpt: 'YOLO26 单模态改多模态 (RGB+IR 双流) 完整改造笔记',
    content: '这里是文章的完整内容...',
    isLocked: true
  },
  {
    id: '2',
    title: 'OpenClaw 从安装到稳定运行：超详细配置教程 (Debian/Ubuntu/WSL，含...',
    date: '2026-03-10',
    category: '教程',
    tags: ['Linux', '安装配置', '教程'],
    excerpt: '详细记录了 OpenClaw 的安装与配置过程。',
    content: '这里是文章的完整内容...'
  },
  {
    id: '3',
    title: '深入理解 AI Agent 的架构与实现',
    date: '2026-03-05',
    category: '教程',
    tags: ['AI Agent', 'Python', '基础模型'],
    excerpt: '本文将深入探讨 AI Agent 的核心架构，包括感知、规划、行动模块，并结合实际代码演示如何构建一个简单的 Agent。',
    content: '这里是文章的完整内容...'
  }
];
