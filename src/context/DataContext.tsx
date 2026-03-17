import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback } from 'react';
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
}

interface Category {
  name: string;
  count: number;
  isHome?: boolean;
}

interface DataContextType {
  config: SiteConfig | null;
  posts: Post[];
  categories: Category[];
  tags: string[];
  loading: boolean;
  refreshData: () => Promise<void>;
  totalWordCount: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function countWords(text: string): number {
  if (!text) return 0;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

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
  const [totalWordCount, setTotalWordCount] = useState<string>('0字');

  const fetchData = useCallback(async () => {
    try {
      const [configRes, postsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/posts')
      ]);
      
      let newConfig: SiteConfig | null = null;
      
      if (configRes.ok) {
        newConfig = await configRes.json();
      }
      
      if (postsRes.ok) {
        const newPosts: Post[] = await postsRes.json();
        setPosts(newPosts);
        
        const catMap = new Map<string, number>();
        const tagSet = new Set<string>();
        let total = 0;
        
        newPosts.forEach(post => {
          catMap.set(post.category, (catMap.get(post.category) || 0) + 1);
          post.tags.forEach(tag => tagSet.add(tag));
          total += countWords(post.title);
          total += countWords(post.excerpt);
          total += countWords(post.content);
        });
        
        const computedCategories: Category[] = [
          { name: '归档', count: newPosts.length, isHome: true },
          ...Array.from(catMap.entries()).map(([name, count]) => ({ name, count }))
        ];
        
        setCategories(computedCategories);
        setTags(Array.from(tagSet));
        setTotalWordCount(formatWordCount(total));
        
        if (newConfig) {
          const updatedConfig: SiteConfig = {
            ...newConfig,
            stats: {
              ...newConfig.stats,
              words: formatWordCount(total),
              articles: newPosts.length,
              categories: computedCategories.filter(c => !c.isHome).length,
              tags: tagSet.size
            }
          };
          setConfig(updatedConfig);
        }
      } else if (newConfig) {
        setConfig(newConfig);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value: DataContextType = {
    config,
    posts,
    categories,
    tags,
    loading,
    refreshData: fetchData,
    totalWordCount
  };

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
