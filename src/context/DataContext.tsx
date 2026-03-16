import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
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
  const [loading, setLoading] = useState(true);
  
  const configRef = useRef<SiteConfig | null>(null);
  const postsRef = useRef<Post[]>([]);
  const categoriesRef = useRef<Category[]>([]);
  const tagsRef = useRef<string[]>([]);
  const totalWordCountRef = useRef<string>('0字');
  
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, postsRes] = await Promise.all([
          fetch('/api/config'),
          fetch('/api/posts')
        ]);
        
        let newConfig: SiteConfig | null = null;
        
        if (configRes.ok) {
          newConfig = await configRes.json();
          configRef.current = newConfig;
        }
        
        if (postsRes.ok) {
          const newPosts: Post[] = await postsRes.json();
          postsRef.current = newPosts;
          
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
          
          const categoryCount = computedCategories.filter((c) => !c.isHome).length;
          
          categoriesRef.current = computedCategories;
          tagsRef.current = Array.from(tagSet);
          totalWordCountRef.current = formatWordCount(total);
          
          if (newConfig) {
            const updatedConfig: SiteConfig = {
              ...newConfig,
              stats: {
                ...newConfig.stats,
                words: formatWordCount(total),
                articles: newPosts.length,
                categories: categoryCount,
                tags: tagSet.size
              }
            };
            configRef.current = updatedConfig;
          }
        } else if (newConfig) {
          configRef.current = newConfig;
        }
        
        setForceRender(n => n + 1);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const value = useMemo(() => ({
    config: configRef.current,
    posts: postsRef.current,
    categories: categoriesRef.current,
    tags: tagsRef.current,
    loading,
    refreshData: async () => {},
    totalWordCount: totalWordCountRef.current
  }), [loading]);

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
