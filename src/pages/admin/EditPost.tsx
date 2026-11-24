import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ArrowLeft, Save, Eye, EyeOff, Image } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { GalleryPicker } from '../../components/admin/GalleryPicker';
import { MarkdownView } from '../../components/markdown/MarkdownView';
import { invalidatePost } from '../../lib/postStore';

export const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, refreshData } = useData();
  const isNew = id === 'new';
  // 已有分类做成输入联想，避免同一个分类写出多种写法
  const categories = useMemo(
    () => [...new Set(posts.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    [posts]
  );

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    tags: '',
    excerpt: '',
    content: '',
    isLocked: false,
    password: '',
    pinned: false
  });

  const [showPreview, setShowPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  /** 在正文光标处插入文本（图床选图后注入 Markdown 图片语法） */
  const insertToContent = (text: string) => {
    const ta = contentRef.current;
    if (!ta) {
      setFormData(prev => ({ ...prev, content: prev.content + text }));
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? start;
    const next = ta.value.slice(0, start) + text + ta.value.slice(end);
    setFormData(prev => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  useEffect(() => {
    if (isNew || !id) return;
    // 列表接口只带摘要：编辑时单独取这一篇的正文与密码原文（需管理令牌）
    let dead = false;
    apiFetch(`/api/posts/${id}`)
      .then(res => (res.ok ? res.json() : null))
      .then((post: any) => {
        if (dead || !post) return;
        setFormData({
          title: post.title,
          date: post.date,
          category: post.category,
          tags: post.tags.join(', '),
          excerpt: post.excerpt,
          content: post.content || '',
          isLocked: post.isLocked || false,
          password: post.password || '',
          pinned: post.pinned || false
        });
      })
      .catch(() => {});
    return () => { dead = true; };
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const postData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    // 新建的加密文章必须带密码（密码只在服务端校验，没有密码就永远无法解锁）
    if (isNew && formData.isLocked && !formData.password) {
      alert('加密文章需要先设置访问密码');
      return;
    }

    try {
      const url = isNew ? '/api/posts' : `/api/posts/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(postData)
      });

      if (res.ok) {
        // 新文章的 id 由服务端分配，整表清缓存；改已有文章只清这一篇
        if (isNew) invalidatePost(); else invalidatePost(id);
        await refreshData();
        navigate('/admin/posts');
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('保存出错，请检查服务是否正常');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/posts')}
            aria-label="返回文章列表"
            className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-1">
              {isNew ? '新建文章' : '编辑文章'}
            </h1>
            <p className="text-text-secondary">撰写或修改文章；正文支持 Markdown 与提示块。</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-text-secondary bg-bg-base border border-border rounded-xl hover:text-accent hover:border-accent transition-colors font-medium"
          >
            <Image className="w-5 h-5" />
            图床插图
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2.5 text-text-secondary bg-bg-base border border-border rounded-xl hover:text-accent hover:border-accent transition-colors font-medium"
          >
            {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {showPreview ? '返回编辑' : '预览'}
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm"
          >
            <Save className="w-5 h-5" />
            保存文章
          </button>
        </div>
      </header>

      {showPreview ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-text-primary mb-4">{formData.title || '（未命名）'}</h2>
          <div className="text-sm text-text-secondary mb-6">
            {formData.date} · {formData.category} · {formData.tags}
          </div>
          {/* 预览与前台同一套渲染器：提示块、代码高亮、公式的效果所见即所得 */}
          <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed dark:prose-invert">
            <MarkdownView content={formData.content || '*（暂无正文）*'} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">标题</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">日期</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">分类</label>
              <input 
                type="text" 
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                list="post-categories"
                placeholder="例如：随笔、项目实战、数据结构与算法"
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
              <datalist id="post-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">标签（逗号分隔）</label>
              <input 
                type="text" 
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="例如：React, TypeScript, 教程"
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4 bg-bg-base rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pinned"
                name="pinned"
                checked={formData.pinned}
                onChange={handleChange}
                className="w-4 h-4 text-accent bg-bg-base border-border rounded focus:ring-accent"
              />
              <label htmlFor="pinned" className="text-sm font-medium text-text-primary cursor-pointer">
                置顶文章（列表与首页优先展示）
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isLocked"
                name="isLocked"
                checked={formData.isLocked}
                onChange={handleChange}
                className="w-4 h-4 text-accent bg-bg-base border-border rounded focus:ring-accent"
              />
              <label htmlFor="isLocked" className="text-sm font-medium text-text-primary cursor-pointer">
                加密文章（需要密码才能阅读，密码在服务端校验）
              </label>
            </div>
            
            {formData.isLocked && (
              <div className="flex flex-col gap-2 ml-7">
                <label className="text-sm font-medium text-text-primary">访问密码</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="留空则沿用原密码"
                  className="w-full md:w-1/2 px-4 py-2 bg-bg-card border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">摘要（列表卡片与搜索结果里显示）</label>
            <textarea 
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={2}
              placeholder="用一两句话概括这篇文章…"
              className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-text-primary">正文（Markdown）</label>
            <div className="border border-border rounded-xl overflow-hidden">
              <textarea
                ref={contentRef}
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={20}
                required
                placeholder={`在这里用 Markdown 写正文……

# 一级标题
## 二级标题

**加粗** 和 *斜体*

- 列表项 1
- 列表项 2

[站内链接](/post/xxx)

\`\`\`java
System.out.println("代码块会自动高亮");
\`\`\`

::: tip 提示块
也支持这样的提示卡
:::`}
                className="w-full px-4 py-3 bg-bg-base text-text-primary focus:outline-none focus:border-accent transition-colors font-mono text-sm resize-y"
              />
            </div>
            <p className="text-xs text-text-muted">
              支持标题、列表、表格、代码块（自动高亮）、提示块（::: tip）与 LaTeX 公式；站外链接会按零外跳规则降级为纯文本。
            </p>
          </div>
        </form>
      )}

      {/* 图床选图：插入 Markdown 图片到正文光标处 */}
      <GalleryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={url => insertToContent(`\n![图片](${url})\n`)}
      />
    </div>
  );
};
