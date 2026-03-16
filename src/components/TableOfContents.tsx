import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Parse headings from content - memoized to prevent re-parsing
  const headings = useMemo<TocItem[]>(() => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '-');
      items.push({ id, text, level });
    }

    return items;
  }, [content]);

  // Setup IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    // Disconnect previous observer if exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    observerRef.current = observer;

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-bg-card rounded-xl p-5 border border-border/50 sticky top-24"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-accent rounded-full" />
        <h3 className="font-bold text-text-primary">目录</h3>
      </div>

      <nav className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={`
              text-left text-sm py-1.5 px-2 rounded-lg transition-all duration-200
              ${heading.level === 2 
                ? 'font-medium' 
                : 'pl-6 text-text-muted'
              }
              ${activeId === heading.id 
                ? 'bg-accent/10 text-accent border-l-2 border-accent' 
                : 'text-text-secondary hover:bg-bg-base hover:text-text-primary'
              }
            `}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </motion.div>
  );
};
