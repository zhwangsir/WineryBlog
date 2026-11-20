import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { SEO } from '../components/SEO';
import { motion } from 'motion/react';

interface TrackStep { t: string; href?: boolean; ext?: string }
interface Track { name: string; steps: TrackStep[] }

const TRACKS: Track[] = [
  { name: 'CS 自学总路线（零基础）', steps: [
    { t: 'CS 自学总纲', href: true }, { t: 'Python 基础入门', href: true },
    { t: 'MIT Missing Semester', ext: 'https://missing.csail.mit.edu/' },
    { t: '数据结构与算法入门', href: true }, { t: 'UCB CS61B', ext: 'https://cs61b-2.fa25.cs61a.org/' },
    { t: 'CMU 15-213 CSAPP', ext: 'http://csapp.cs.cmu.edu/' },
    { t: '选方向深入（Web/AI/安全/分布式）' },
  ]},
  { name: 'Web 全栈路线', steps: [
    { t: 'css语法', href: true }, { t: 'js语法', href: true },
    { t: 'JavaScript 异步编程全解：事件循环、Promise 与 async/await', href: true },
    { t: '1.为什么使用TS和TS运行环境搭建', href: true }, { t: 'TypeScript 进阶：泛型与类型体操入门', href: true },
    { t: '前端工程化入门：npm、Vite 与构建部署', href: true },
    { t: 'React 核心补充：Hooks 与状态管理', href: true },
    { t: 'Full Stack Open', ext: 'https://fullstackopen.com/zh/' },
    { t: 'Node.js 核心机制：事件循环、模块体系与工程实践', href: true },
    { t: '数据库系统导论', href: true }, { t: 'Linux 服务器运维清单：Nginx、防火墙与日常巡检', href: true },
  ]},
  { name: 'Java 后端路线', steps: [
    { t: 'JAVA程序基础', href: true }, { t: '面向对象编程', href: true }, { t: 'Java数组', href: true },
    { t: 'Java 核心进阶：集合框架与并发编程入门', href: true },
    { t: 'SpringMVC', href: true }, { t: 'Mybatis XML文件', href: true },
    { t: '数据库系统导论', href: true }, { t: 'ruoyi-admin', href: true },
  ]},
  { name: 'AI / 机器学习路线', steps: [
    { t: 'Python 基础入门', href: true }, { t: '1.什么是机器学习', href: true },
    { t: '李宏毅机器学习', ext: 'https://speech.ee.ntu.edu.tw/~hylee/index.php' },
    { t: '深度学习与 PyTorch 入门', href: true },
    { t: 'Stanford CS231n', ext: 'http://cs231n.stanford.edu/' },
    { t: '大语言模型自学路线', href: true },
    { t: '本地大模型部署实战：Ollama 与 SGLang', href: true },
    { t: '本地知识库与 RAG 实战', href: true },
  ]},
  { name: '信息安全路线（仅限授权学习）', steps: [
    { t: '网络基础', href: true }, { t: 'HTTP/HTTPS 协议详解', href: true },
    { t: 'KALI的简单介绍', href: true }, { t: 'Nmap 信息收集实战手册', href: true },
    { t: 'SQL注入', href: true }, { t: 'SQL 注入实战进阶：Union、报错、盲注与防御', href: true },
    { t: 'MSF基本介绍', href: true }, { t: 'ms17-010', href: true },
    { t: 'SSH私钥泄露', href: true }, { t: 'UCB CS161', ext: 'https://cs161.org/' },
  ]},
  { name: 'Rust 系统编程路线', steps: [
    { t: '1.安装', href: true }, { t: '2.Hello World', href: true }, { t: '3.变量和可变性', href: true },
    { t: '4.数据类型', href: true }, { t: '5.流程控制', href: true }, { t: '6.结构体函数和方法', href: true },
    { t: '7.泛型类型', href: true }, { t: 'Rust 所有权、借用与生命周期详解', href: true },
  ]},
  { name: '数据工程路线', steps: [
    { t: '数据库系统导论', href: true }, { t: 'Sql快速入门（上）', href: true },
    { t: '大数据导论', href: true }, { t: 'Apache Hadoop概述 ', href: true },
    { t: 'Hadoop 生态补全：YARN、MapReduce 与 Hive 入门', href: true },
    { t: 'docker的安装', href: true }, { t: 'Docker 常用命令与 Compose 实战', href: true },
  ]},
  { name: 'Android 移动开发路线', steps: [
    { t: '1.导学', href: true }, { t: '2.Kotlin必知必会', href: true },
    { t: 'Android布局和控件', href: true }, { t: 'Android 四大组件与生命周期', href: true },
  ]},
];

export const LearningPaths: React.FC = () => {
  const { posts } = useData();
  const postTitles = new Set(posts.map(p => p.title));

  return (
    <>
      <SEO title="学习路线" description="8 条按阶段排布的自学路线，站内文章与权威外部课程穿插" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">学习路线</h1>
          <p className="text-sm text-text-muted">
            按「地基 → 核心 → 方向 → 实战」排布的推荐顺序，站内文章与权威外部课程穿插。
          </p>
        </div>
        {TRACKS.map(track => (
          <motion.div
            key={track.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-bg-card rounded-xl border border-border/30 p-5"
          >
            <h2 className="text-base font-semibold text-text-primary mb-3">{track.name}</h2>
            <ol className="space-y-1.5">
              {track.steps.map((step, i) => {
                const post = step.href ? posts.find(p => p.title === step.t) : null;
                if (step.ext) {
                  return (
                    <li key={i} className="text-sm">
                      <a href={step.ext} target="_blank" rel="noopener noreferrer"
                         className="text-accent hover:underline">
                        {step.t}
                      </a>
                      <span className="text-xs text-text-muted ml-2">↗ 外部课程</span>
                    </li>
                  );
                }
                if (post) {
                  return (
                    <li key={i} className="text-sm">
                      <Link to={`/post/${post.id}`}
                            className="text-text-primary hover:text-accent transition-colors">
                        {step.t}
                      </Link>
                    </li>
                  );
                }
                return <li key={i} className="text-sm text-text-muted">{step.t}</li>;
              })}
            </ol>
          </motion.div>
        ))}
      </div>
    </>
  );
};
