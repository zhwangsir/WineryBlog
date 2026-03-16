import React, { useEffect, useRef } from 'react';

interface WaveProps {
  className?: string;
  flip?: boolean;
  style?: 'smooth' | 'dynamic';
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * 波浪效果组件
 * 
 * 在 Hero 底部显示波浪过渡效果
 * 使用 CSS 动画实现平滑的波浪运动
 */
export const Wave: React.FC<WaveProps> = ({ 
  className = '', 
  flip = false,
  style = 'smooth',
  speed = 'normal'
}) => {
  const waveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wave = waveRef.current;
    if (!wave) return;

    // 使用 CSS 动画代替 JS 动画以获得更好的性能
    const duration = speed === 'slow' ? '20s' : speed === 'fast' ? '8s' : '12s';
    wave.style.setProperty('--wave-duration', duration);
  }, [speed]);

  return (
    <div 
      ref={waveRef}
      className={`w-full h-[80px] md:h-[100px] overflow-hidden ${className}`}
      style={{
        transform: flip ? 'rotate(180deg)' : 'none',
        marginTop: flip ? '-1px' : '-80px',
        position: 'relative',
        zIndex: 10
      }}
    >
      <svg
        viewBox="0 0 1440 120"
        className="w-[200%] h-full wave-animation"
        preserveAspectRatio="none"
        style={{
          animation: `waveMove var(--wave-duration, 12s) linear infinite`,
          opacity: 0.9
        }}
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.8 }} />
          </linearGradient>
        </defs>
        <path
          d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
          fill="url(#waveGradient)"
        />
      </svg>

      {/* 第二层波浪 */}
      <svg
        viewBox="0 0 1440 120"
        className="absolute top-0 w-[200%] h-full"
        preserveAspectRatio="none"
        style={{
          animation: `waveMove var(--wave-duration, 12s) linear infinite reverse`,
          animationDelay: '-4s',
          opacity: 0.5
        }}
      >
        <path
          d="M0,80 C360,20 720,100 1080,80 C1260,70 1350,90 1440,80 L1440,120 L0,120 Z"
          fill="var(--accent)"
        />
      </svg>

      {/* 第三层波浪 */}
      <svg
        viewBox="0 0 1440 120"
        className="absolute top-0 w-[200%] h-full"
        preserveAspectRatio="none"
        style={{
          animation: `waveMove var(--wave-duration, 12s) linear infinite`,
          animationDelay: '-2s',
          opacity: 0.3
        }}
      >
        <path
          d="M0,100 C480,60 960,100 1440,100 L1440,120 L0,120 Z"
          fill="var(--accent)"
        />
      </svg>

      <style>{`
        @keyframes waveMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
