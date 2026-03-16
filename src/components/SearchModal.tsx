import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, FileText, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { posts } = useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredPosts = query.trim() === '' 
    ? [] 
    : posts.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        post.content.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (id: string) => {
    onClose();
    navigate(`/post/${id}`);
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
              {/* Search Input */}
              <div className="relative flex items-center p-4 border-b border-border">
                <Search className="w-6 h-6 text-accent absolute left-6" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索文章标题或内容..."
                  className="w-full bg-transparent border-none text-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0 pl-12 pr-10"
                />
                <button 
                  onClick={onClose}
                  className="absolute right-6 p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-base transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Results */}
              <div className="overflow-y-auto custom-scrollbar p-2">
                {query.trim() === '' ? (
                  <div className="py-12 text-center text-text-muted flex flex-col items-center gap-3">
                    <Search className="w-10 h-10 opacity-20" />
                    <p>输入关键词开始搜索</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="py-12 text-center text-text-muted">
                    没有找到与 "{query}" 相关的文章。
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {filteredPosts.map(post => (
                      <button
                        key={post.id}
                        onClick={() => handleSelect(post.id)}
                        className="flex flex-col gap-2 p-4 rounded-xl hover:bg-bg-base text-left transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-text-primary group-hover:text-accent transition-colors">
                            {post.title}
                          </h3>
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Calendar className="w-3 h-3" />
                            {post.date}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {post.excerpt}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-3 border-t border-border bg-bg-base/50 text-xs text-text-muted flex justify-between items-center">
                <span>共找到 {filteredPosts.length} 篇文章</span>
                <span className="flex items-center gap-1">
                  按 <kbd className="px-1.5 py-0.5 rounded bg-bg-card border border-border font-mono text-[10px]">ESC</kbd> 关闭
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
