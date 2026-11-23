/**
 * 文章数据类型。
 * - 列表接口（/api/posts）只下发摘要：不含 content/password，附带服务端算好的 words
 * - 正文按需取：GET /api/posts/:id（见 lib/postStore）
 */
export interface Post {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  /** 仅单篇接口下发；摘要列表里没有 */
  content?: string;
  isLocked?: boolean;
  /** 单篇接口对未解锁的加密文章置 true（此时 content 为空串） */
  locked?: boolean;
  cover?: string;
  pinned?: boolean;
  views?: number;
  /** 字数（中文按字、英文按词），服务端计算 */
  words?: number;
  /** 收录来源仓库（GitHub 收录的专题教程才有） */
  source?: string;
}

/** 阅读时长（分钟）：中文约 300 字/分钟，最少 1 分钟 */
export const readingMinutes = (post: Pick<Post, 'words'>) =>
  Math.max(1, Math.ceil((post.words || 0) / 300));
