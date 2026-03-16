import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Post } from '../data/posts';

interface SiteConfig {
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
    <DataContext.Provider value={{ config, posts, categories, tags, loading, refreshData: fetchData }}>
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
