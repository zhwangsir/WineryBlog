import type { Post } from '../data/posts';

/**
 * 单篇文章存取：正文按需获取 + 进程内缓存 + 加密文章解锁。
 * 列表接口不再携带正文，文章页从这里取。
 */
const cache = new Map<string, Post>();

const tokenKey = (id: string) => `unlock:${id}`;
const savedToken = (id: string) => {
  try { return sessionStorage.getItem(tokenKey(id)) || ''; } catch { return ''; }
};

export class UnlockError extends Error {}

/** 取单篇；不存在返回 null；网络/服务异常抛错（调用方展示重试） */
export async function fetchPost(id: string): Promise<Post | null> {
  const hit = cache.get(id);
  if (hit && !hit.locked) return hit;
  const token = savedToken(id);
  const res = await fetch(`/api/posts/${encodeURIComponent(id)}${token ? `?unlock=${encodeURIComponent(token)}` : ''}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const post = (await res.json()) as Post;
  if (post.locked) cache.delete(id);
  else cache.set(id, post);
  return post;
}

/** 校验密码并解锁；成功后返回带正文的完整文章（令牌 12 小时内免重复输入） */
export async function unlockPost(id: string, password: string): Promise<Post> {
  const res = await fetch(`/api/posts/${encodeURIComponent(id)}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) throw new UnlockError('密码错误，请重试');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { token } = await res.json();
  try { sessionStorage.setItem(tokenKey(id), token || ''); } catch { /* 隐私模式下忽略 */ }
  const post = await fetchPost(id);
  if (!post || post.locked) throw new Error('解锁失败');
  return post;
}

/** 管理端保存后让缓存失效 */
export function invalidatePost(id?: string) {
  if (id) cache.delete(id);
  else cache.clear();
}
