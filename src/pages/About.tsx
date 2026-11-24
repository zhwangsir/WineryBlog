import React, { useMemo } from 'react';
import { Mail, Github, MessageCircle, Globe, Link as LinkIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SEO } from '../components/SEO';
import { MarkdownView } from '../components/markdown/MarkdownView';
import { useCareers, useLabs, useTutorials } from '../lib/catalog';

const iconMap: Record<string, React.ElementType> = {
  mail: Mail,
  github: Github,
  qq: MessageCircle,
  globe: Globe,
};

export const About: React.FC = () => {
  const { config, posts } = useData();
  const { data: catalog } = useTutorials();
  const { data: careers } = useCareers();
  const { data: labs } = useLabs();

  // 未在后台填写「关于」时，默认介绍这座站本身（数字取实时数据）
  const defaultContent = useMemo(() => `
你好，我是 **${config?.profile?.name || config?.author || 'Winery'}**。这里是 WineryBlog——一座放在浏览器里的个人自学图书馆。

## 这里有什么

- **教程中心**：${catalog?.tutorials.length ?? '…'} 篇系统教程，按 ${catalog?.domains.length ?? '…'} 个知识域与 ${careers?.length ?? '…'} 条职业路线编排，从编程基础到分布式、从算法到强化学习
- **实验室**：${labs?.length ?? '…'} 个配套实验，在浏览器里写完即运行，AI 教练按验收标准陪你做完
- **知识图谱**：全站 ${posts.length} 篇内容的关系网络，2D / 3D 自由切换，顺着脉络找下一本
- **AI 馆员**：本地大模型驱动的胡桃馆员，认识全馆藏书，帮你答疑、找书、规划路线

## 一些坚持

::: tip 全站本地化
所有教程、图片、字体都在站内，读者的任何一次点击都不会离开这里——安心读，不用担心中途被带走。
:::

内容来自两部分：一部分是自己写的系统教程，一部分是收录整理的开源教程专题（GitHub 高质量教程仓库），统一做了目录化与本地化处理，并在文末标注来源。

::: info 想聊聊？
学习路线、某篇教程的问题，或者想推荐一本好书，都欢迎找 AI 馆员代为转达，或者通过下面的联系方式找我。
:::

> ${config?.subtitle || '永远相信，美好的事情即将发生。'}
`.trim(), [config, posts.length, catalog, careers, labs]);

  const aboutContent = config?.about?.content || defaultContent;
  const skills = config?.about?.skills || [
    'React / Vue / TypeScript',
    'Node.js / Python / Go',
    'AI Agent / 深度学习',
    'Linux / DevOps'
  ];
  const stats = config?.stats;

  return (
    <>
      <SEO
        title={`关于我 - ${config?.title || 'WineryBlog'}`}
        description={config?.subtitle || '了解更多关于作者的信息'}
        author={config?.author}
        keywords={['关于', '个人介绍', '技术博客', ...(config?.tags || [])]}
      />
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-4 border-b border-border pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
            关于我
          </h1>
          <p className="max-w-2xl text-lg text-text-secondary">
            {config?.subtitle || '了解更多关于作者的信息。'}
          </p>
        </header>

        {/* Profile Card */}
        <div className="bg-bg-card rounded-2xl p-8 border border-border/60">
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="w-32 h-32 shrink-0 overflow-hidden rounded-full border-4 border-accent/20">
              <img
                src={config?.profile?.avatar || '/images/default-avatar.svg'}
                alt={config?.profile?.name || 'Avatar'}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="mb-2 text-2xl font-bold text-text-primary">
                {config?.profile?.name || config?.author || 'Winery'}
              </h2>
              <p className="mb-4 text-text-secondary">
                {config?.profile?.bio || '永远相信，美好的事情即将发生。'}
              </p>

              {config?.social && config.social.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                  {config.social.map((item) => {
                    const Icon = iconMap[item.platform.toLowerCase()] || LinkIcon;
                    return (
                      <a
                        key={item.platform}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-border bg-bg-base px-4 py-2 text-text-secondary transition-all hover:border-accent hover:text-accent"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{item.platform === 'mail' ? '邮件' : item.platform === 'qq' ? 'QQ' : item.platform}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed dark:prose-invert">
              <MarkdownView content={aboutContent} />
            </div>
          </div>

          <div className="space-y-6">
            {skills.length > 0 && (
              <div className="bg-bg-card rounded-xl border border-border/60 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
                  <span className="h-5 w-1 rounded-full bg-accent" />
                  技术栈
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="rounded-lg border border-border bg-bg-base px-3 py-1.5 text-sm text-text-secondary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stats && (
              <div className="bg-bg-card rounded-xl border border-border/60 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
                  <span className="h-5 w-1 rounded-full bg-accent" />
                  站点统计
                </h3>
                <dl className="space-y-3 text-sm">
                  {[
                    ['文章', stats.articles],
                    ['分类', stats.categories],
                    ['标签', stats.tags],
                    ['总字数', stats.words],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-text-muted">{label}</dt>
                      <dd className="font-medium text-text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
