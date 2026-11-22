import React, { useState } from 'react';
import { coverChain } from '../lib/cover';

interface CoverImageProps {
  post: { id: string; cover?: string };
  className?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
}

/** 文章封面图：按回落链自动降级（图床封面 → 胡桃主题 → SVG 渐变） */
export const CoverImage: React.FC<CoverImageProps> = ({ post, className, alt, loading = 'lazy' }) => {
  const chain = coverChain(post);
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, chain.length - 1);
  return (
    <img
      src={chain[safeIdx]}
      alt={alt || ''}
      loading={loading}
      draggable={false}
      onError={() => setIdx(i => i + 1)}
      className={className}
    />
  );
};
