import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const EditPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { posts, refreshData } = useData();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    tags: '',
    excerpt: '',
    content: '',
    isLocked: false,
    password: ''
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isNew && posts.length > 0) {
      const post = posts.find(p => p.id === id);
      if (post) {
        setFormData({
          title: post.title,
          date: post.date,
          category: post.category,
          tags: post.tags.join(', '),
          excerpt: post.excerpt,
          content: post.content,
          isLocked: post.isLocked || false,
          password: post.password || ''
        });
      }
    }
  }, [id, isNew, posts]);

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

    try {
      const url = isNew ? '/api/posts' : `/api/posts/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (res.ok) {
        await refreshData();
        navigate('/admin/posts');
      } else {
        alert('Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/posts')}
            className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-1">
              {isNew ? 'Create Post' : 'Edit Post'}
            </h1>
            <p className="text-text-secondary">Write or edit your blog content.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2.5 text-text-secondary bg-bg-base border border-border rounded-xl hover:text-accent hover:border-accent transition-colors font-medium"
          >
            {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm"
          >
            <Save className="w-5 h-5" />
            Save Post
          </button>
        </div>
      </header>

      {showPreview ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-text-primary mb-4">{formData.title}</h2>
          <div className="text-sm text-text-secondary mb-6">
            {formData.date} · {formData.category} · {formData.tags}
          </div>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {formData.content || '*No content*'}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Title</label>
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
              <label className="text-sm font-medium text-text-primary">Date</label>
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
              <label className="text-sm font-medium text-text-primary">Category</label>
              <input 
                type="text" 
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="e.g., 教程, 论文阅读, 项目文档"
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Tags (comma separated)</label>
              <input 
                type="text" 
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., React, TypeScript, 教程"
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4 bg-bg-base rounded-xl border border-border">
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
                Lock Post (Password Protected)
              </label>
            </div>
            
            {formData.isLocked && (
              <div className="flex flex-col gap-2 ml-7">
                <label className="text-sm font-medium text-text-primary">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password to protect this post"
                  className="w-full md:w-1/2 px-4 py-2 bg-bg-card border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">Excerpt</label>
            <textarea 
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={2}
              placeholder="Brief description of the post..."
              className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-medium text-text-primary">Content (Markdown Supported)</label>
            <div className="border border-border rounded-xl overflow-hidden">
              <textarea 
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={20}
                required
                placeholder="Write your content in Markdown format...

# Heading 1
## Heading 2

**Bold** and *italic* text

- List item 1
- List item 2

[Link](https://example.com)

```code block```

> Quote"
                className="w-full px-4 py-3 bg-bg-base text-text-primary focus:outline-none focus:border-accent transition-colors font-mono text-sm resize-y"
              />
            </div>
            <p className="text-xs text-text-muted">
              Supports Markdown syntax: headings, bold, italic, lists, links, code blocks, tables, etc.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
