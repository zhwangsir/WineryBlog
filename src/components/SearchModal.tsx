import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, FileText, Calendar, Tag, Folder } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import type { Post } from '../data/posts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  post: Post;
  score: number;
  matches: {
    title: boolean;
    excerpt: boolean;
    content: boolean;
    tags: boolean;
    category: boolean;
  };
  /** 正文命中片段（服务端全文检索返回） */
  snippet?: string;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 标题/分类/标签/摘要打分（摘要列表即可完成，输入后立刻出结果；正文检索由服务端补上） */
function scoreSummaries(posts: Post[], query: string): SearchResult[] {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (!queryWords.length) return [];
  return posts
    .map(post => {
      const titleLower = post.title.toLowerCase();
      const excerptLower = post.excerpt.toLowerCase();
      const tagsLower = post.tags.map(t => t.toLowerCase());
      const categoryLower = post.category.toLowerCase();
      let score = 0;
      const matches = { title: false, excerpt: false, content: false, tags: false, category: false };
      for (const word of queryWords) {
        if (titleLower.includes(word)) {
          score += 100;
          matches.title = true;
          if (titleLower === word) score += 50;
        }
        if (categoryLower.includes(word)) { score += 80; matches.category = true; }
        if (tagsLower.some(t => t.includes(word))) { score += 60; matches.tags = true; }
        if (excerptLower.includes(word)) { score += 40; matches.excerpt = true; }
      }
      return { post, score, matches };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-accent/30 text-accent rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

interface RemoteSearch { q: string; results: SearchResult[]; total: number }

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { posts } = useData();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [remote, setRemote] = useState<RemoteSearch | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const debouncedQuery = useDebounce(query, 200);

  // 即时结果：摘要列表上的标题/分类/标签/摘要匹配
  const localResults = useMemo<SearchResult[]>(
    () => scoreSummaries(posts, debouncedQuery),
    [debouncedQuery, posts]
  );

  // 全文结果：列表不携带正文，正文检索走服务端（/api/search），返回后替换即时结果
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) { setRemote(null); return; }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=30`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { results?: SearchResult[]; total?: number }) => {
        setRemote({ q, results: j.results || [], total: j.total || 0 });
      })
      .catch(() => { /* 中断或服务异常：保留即时结果 */ });
    return () => ctrl.abort();
  }, [debouncedQuery]);

  // 服务端结果已覆盖当前关键词时采用全文结果，否则先用即时结果
  const full = remote && remote.q === debouncedQuery.trim() ? remote : null;
  const searchResults = full ? full.results : localResults;

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !isOpen)) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  // Modal keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleSelect(searchResults[selectedIndex].post.id);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, searchResults, selectedIndex]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && searchResults.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, searchResults.length]);

  const handleSelect = useCallback((id: string) => {
    onClose();
    navigate(`/post/${id}`);
  }, [onClose, navigate]);

  const getResultSnippet = (result: SearchResult, query: string): string => {
    if (result.matches.content && result.snippet) return result.snippet;
    return result.post.excerpt;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101] px-4"
          >
            <div className="bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="relative flex items-center p-4 border-b border-border">
                <Search className="w-6 h-6 text-accent absolute left-6" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索文章标题、内容、标签..."
                  className="w-full bg-transparent border-none text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 pl-12 pr-24"
                />
                <div className="absolute right-6 flex items-center gap-2">
                  {query && (
                    <button 
                      onClick={() => {
                        setQuery('');
                        inputRef.current?.focus();
                      }}
                      className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-base transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="px-2 py-1 rounded-md text-xs text-text-muted bg-bg-base border border-border hover:border-accent transition-colors"
                  >
                    ESC
                  </button>
                </div>
              </div>

              <div 
                ref={resultsRef}
                className="overflow-y-auto custom-scrollbar p-2"
              >
                {query.trim() === '' ? (
                  <div className="py-12 text-center text-text-muted flex flex-col items-center gap-3">
                    <Search className="w-10 h-10 opacity-20" />
                    <p>输入关键词开始搜索</p>
                    <p className="text-xs">支持搜索标题、内容、标签和分类</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 text-center text-text-muted">
                    <Search className="w-10 h-10 opacity-20 mx-auto mb-3" />
                    <p>没有找到与 "{debouncedQuery}" 相关的文章</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {searchResults.map((result, index) => (
                      <button
                        key={result.post.id}
                        onClick={() => handleSelect(result.post.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex flex-col gap-2 p-4 rounded-xl text-left transition-all group ${
                          index === selectedIndex 
                            ? 'bg-accent/10 border border-accent/30' 
                            : 'hover:bg-bg-base border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className={`text-lg font-medium transition-colors ${
                            index === selectedIndex ? 'text-accent' : 'text-text-primary group-hover:text-accent'
                          }`}>
                            <HighlightText text={result.post.title} query={debouncedQuery} />
                          </h3>
                          <span className="flex items-center gap-1 text-xs text-text-muted shrink-0">
                            <Calendar className="w-3 h-3" />
                            {result.post.date}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            <HighlightText text={result.post.category} query={debouncedQuery} />
                          </span>
                          {result.post.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {result.post.tags.slice(0, 3).map((tag, i) => (
                                <React.Fragment key={tag}>
                                  <HighlightText text={tag} query={debouncedQuery} />
                                  {i < Math.min(result.post.tags.length, 3) - 1 && ','}
                                </React.Fragment>
                              ))}
                              {result.post.tags.length > 3 && '...'}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-text-secondary line-clamp-2">
                          <HighlightText 
                            text={getResultSnippet(result, debouncedQuery)} 
                            query={debouncedQuery} 
                          />
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-border bg-bg-base/50 text-xs text-text-muted flex justify-between items-center">
                <span>
                  {searchResults.length > 0 ? (
                    <>找到 <strong className="text-text-primary">{full ? full.total : searchResults.length}</strong> 篇文章{full && full.total > full.results.length ? `，显示前 ${full.results.length} 篇` : ''}</>
                  ) : (
                    '开始输入以搜索'
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-bg-card border border-border font-mono text-[10px]">↑↓</kbd>
                    选择
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-bg-card border border-border font-mono text-[10px]">Enter</kbd>
                    跳转
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
