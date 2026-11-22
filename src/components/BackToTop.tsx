import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** 回到顶部浮动按钮：左下角（避开右下角桌宠），滚动超过 600px 出现 */
export const BackToTop: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 left-6 z-[880] w-11 h-11 rounded-full bg-bg-card/90 backdrop-blur border border-border shadow-lg flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent hover:scale-110 transition-all"
      title="回到顶部"
      aria-label="回到顶部"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
