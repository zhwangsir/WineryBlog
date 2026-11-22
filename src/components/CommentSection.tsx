import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Send, Loader2, EyeOff } from 'lucide-react';

interface Comment {
  id: string;
  name: string;
  content: string;
  time: string;
}

const NAME_KEY = 'wineryblog-comment-name';

/** 由昵称稳定生成头像底色（HSL，避开过暗/过饱和区间） */
function avatarColor(name: string): string {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `hsl(${Math.abs(h) % 360} 55% 45%)`;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString();
}

/**
 * 文章评论区：先发先显（后台可隐藏），同 IP 60 秒限一条。
 * 存储在服务端本地 JSON（server/data/comments.json）。
 */
export const CommentSection: React.FC<{ postId: string }> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch { /* 静默 */ }
    setLoading(false);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!name.trim() || content.trim().length < 2) {
      setMsg({ ok: false, text: '请填写昵称，内容至少 2 个字符' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      localStorage.setItem(NAME_KEY, name.trim());
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || '发表失败' });
      } else {
        setComments(prev => [data.comment, ...prev]);
        setContent('');
        setMsg({ ok: true, text: '评论已发布' });
      }
    } catch {
      setMsg({ ok: false, text: '网络错误' });
    }
    setSubmitting(false);
  };

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-8">
      <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-accent" />
        评论 {comments.length > 0 && <span className="text-sm font-normal text-text-muted">({comments.length})</span>}
      </h2>

      {/* 发表框 */}
      <div className="flex flex-col gap-3 bg-bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            placeholder="昵称（必填）"
            className="w-44 px-3 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
          />
          <span className="text-xs text-text-muted">支持 Markdown 之外的纯文本，同 IP 60 秒限一条</span>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="写下你的想法、疑问或补充…"
          className="w-full px-4 py-2.5 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors resize-y"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">{content.length}/500</span>
          <button
            onClick={submit}
            disabled={submitting || !name.trim() || content.trim().length < 2}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            发表评论
          </button>
        </div>
        {msg && (
          <p className={`text-xs flex items-center gap-1 ${msg.ok ? 'text-green-500' : 'text-red-500'}`}>
            {msg.ok ? null : <EyeOff className="w-3.5 h-3.5" />}
            {msg.text}
          </p>
        )}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">还没有评论，来抢第一个沙发～</p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: avatarColor(c.name) }}
              >
                {c.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 bg-bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text-primary">{c.name}</span>
                  <span className="text-xs text-text-muted">{relTime(c.time)}</span>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
