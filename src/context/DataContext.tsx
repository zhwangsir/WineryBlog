import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback, useMemo } from 'react';
import { Post } from '../data/posts';

interface SiteConfig {
  domain?: string;
  title: string;
  author: string;
  subtitle: string;
  hero: {
    title: string;
    subtitle: string;
    image: string;
    credit: string;
  };
  profile: {
    avatar: string;
    name: string;
    bio: string;
  };
  stats: {
    articles: number;
    categories: number;
    tags: number;
    words: string;
    runningDays: number;
    lastActivity: string;
  };
  nav: {
    name: string;
    path: string;
    icon: string;
    external?: boolean;
    href?: string;
  }[];
  theme?: {
    accentColor?: string;
    cursorUrl?: string;
    globalBackground?: string;
    waveStyle?: 'smooth' | 'dynamic';
    waveSpeed?: 'slow' | 'normal' | 'fast';
    waveEnabled?: boolean;
    sakuraEnabled?: boolean;
    sakuraDensity?: number;
    sakuraSpeed?: 'slow' | 'normal' | 'fast';
    mascotEnabled?: boolean;
    wallpaperEnabled?: boolean;
    pet?: {
      enabled?: boolean;
      model?: 'hutao' | 'fallback';
      voiceEnabled?: boolean;
      size?: number;
      opacity?: number;
    };
  };
  music?: {
    enabled: boolean;
    url: string;
    title: string;
    artist: string;
    cover: string;
    autoplay: boolean;
  };
  social?: {
    platform: string;
    url: string;
  }[];
  footer?: {
    copyright: string;
    icp?: string;
  };
  about?: {
    content: string;
    skills?: string[];
  };
  tags?: string[];
  friends?: {
    name: string;
    url: string;
    avatar: string;
    desc: string;
  }[];
}

interface Category {
  name: string;
  count: number;
  isHome?: boolean;
}

interface DataContextType {
  config: SiteConfig | null;
  /** 摘要列表（不含正文，正文经 lib/postStore 按需获取） */
  posts: Post[];
  categories: Category[];
  tags: string[];
  loading: boolean;
  /** 最近一次加载失败的原因；成功后清空 */
  error: string | null;
  refreshData: () => Promise<void>;
  totalWordCount: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function formatWordCount(count: number): string {
  if (count >= 10000) {
    const wan = (count / 10000).toFixed(1);
    return `${wan.replace(/\.0$/, '')}万字`;
  }
  return `${count}字`;
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalWordCount, setTotalWordCount] = useState<string>('0字');

  const fetchData = useCallback(async () => {
    try {
      const [configRes, postsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/posts')
      ]);

      const failures: string[] = [];
      let newConfig: SiteConfig | null = null;
      let newPosts: Post[] | null = null;

      if (configRes.ok) {
        newConfig = await configRes.json();
      } else {
        failures.push('站点配置');
      }

      if (postsRes.ok) {
        newPosts = await postsRes.json();
      } else {
        failures.push('文章列表');
      }

      if (newPosts) {
        const catMap = new Map<string, number>();
        const tagSet = new Set<string>();
        let total = 0;
        // 字数由服务端随摘要下发（列表不再携带正文，前端不再逐篇统计）
        newPosts.forEach(post => {
          catMap.set(post.category, (catMap.get(post.category) || 0) + 1);
          (post.tags || []).forEach(tag => tagSet.add(tag));
          total += post.words || 0;
        });

        const computedCategories: Category[] = [
          { name: '归档', count: newPosts.length, isHome: true },
          ...Array.from(catMap.entries()).map(([name, count]) => ({ name, count }))
        ];

        setPosts(newPosts);
        setCategories(computedCategories);
        setTags(Array.from(tagSet));
        setTotalWordCount(formatWordCount(total));

        if (newConfig) {
          setConfig({
            ...newConfig,
            stats: {
              ...newConfig.stats,
              words: formatWordCount(total),
              articles: newPosts.length,
              categories: computedCategories.filter(c => !c.isHome).length,
              tags: tagSet.size
            }
          });
        }
      } else if (newConfig) {
        setConfig(newConfig);
      }

      setError(failures.length ? `${failures.join('、')}加载失败，请检查服务后重试` : null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('数据加载失败，请检查网络或服务后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = useMemo<DataContextType>(
    () => ({ config, posts, categories, tags, loading, error, refreshData: fetchData, totalWordCount }),
    [config, posts, categories, tags, loading, error, fetchData, totalWordCount]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export type { SiteConfig, Category };
