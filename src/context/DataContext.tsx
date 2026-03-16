import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
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

// Count words in text (Chinese characters + English words)
function countWords(text: string): number {
  if (!text) return 0;
  
  // Count Chinese characters
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // Count English words (sequences of letters)
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  
  return chineseChars + englishWords;
}

// Format word count (e.g., 12500 -> "1.3万字", 850 -> "850字")
function formatWordCount(count: number): string {
  if (count >= 10000) {
    const wan = (count / 10000).toFixed(1);
    // Remove trailing .0
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

  // Calculate total word count from all posts
  const totalWordCount = useMemo(() => {
    let total = 0;
    posts.forEach(post => {
      total += countWords(post.title);
      total += countWords(post.excerpt);
      total += countWords(post.content);
    });
    return formatWordCount(total);
  }, [posts]);

  // Update config with computed word count
  const configWithComputedStats = useMemo(() => {
    if (!config) return null;
    return {
      ...config,
      stats: {
        ...config.stats,
        words: totalWordCount,
        articles: posts.length,
        categories: categories.filter(c => !c.isHome).length,
        tags: tags.length
      }
    };
  }, [config, totalWordCount, posts.length, categories, tags.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, postsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/posts')
      ]);
      
      if (configRes.ok) {
        setConfig(await configRes.json());
      }
      if (postsRes.ok) {
        const fetchedPosts: Post[] = await postsRes.json();
        setPosts(fetchedPosts);
        
        // Compute categories
        const catMap = new Map<string, number>();
        const tagSet = new Set<string>();
        
        fetchedPosts.forEach(post => {
          catMap.set(post.category, (catMap.get(post.category) || 0) + 1);
          post.tags.forEach(tag => tagSet.add(tag));
        });
        
        const computedCategories: Category[] = [
          { name: '归档', count: fetchedPosts.length, isHome: true },
          ...Array.from(catMap.entries()).map(([name, count]) => ({ name, count }))
        ];
        
        setCategories(computedCategories);
        setTags(Array.from(tagSet));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ 
      config: configWithComputedStats, 
      posts, 
      categories, 
      tags, 
      loading, 
      refreshData: fetchData,
      totalWordCount 
    }}>
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
