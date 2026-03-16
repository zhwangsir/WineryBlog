import React, { useEffect, useState } from 'react';

interface WaveProps {
  className?: string;
  flip?: boolean;
  style?: 'smooth' | 'dynamic';
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * 波浪效果组件 - 方案 A：平滑渐变波浪
 * 
 * 视觉特征:
 * - 三层 SVG 波浪，每层不同振幅和波长
 * - 颜色从 accent 渐变到 bg-base
 * - 透明度逐层递减 (0.8, 0.5, 0.3)
 * 
 * 动画效果:
 * - 波浪从左到右水平移动
 * - 三层不同速度产生视差效果
 * - 无限循环
 * 
 * 性能优化:
 * - 使用 CSS transform 而非 position
 * - will-change 提示浏览器优化
 * - requestAnimationFrame 平滑动画
 */
export const Wave: React.FC<WaveProps> = ({ 
  className = '', 
  flip = false,
  style = 'smooth',
  speed = 'normal'
}) => {
  const [offset1, setOffset1] = useState(0);
  const [offset2, setOffset2] = useState(0);
  const [offset3, setOffset3] = useState(0);

  useEffect(() => {
    let animationId: number;
    let startTime: number;

    const speedMap = {
      slow: 0.0003,
      normal: 0.0005,
      fast: 0.0008
    };

    const baseSpeed = speedMap[speed];

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      setOffset1((elapsed * baseSpeed) % 100);
      setOffset2((elapsed * baseSpeed * 1.5) % 100);
      setOffset3((elapsed * baseSpeed * 2) % 100);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [speed]);

  const getSpeedStyle = (layer: number) => {
    const speeds = {
      1: offset1,
      2: offset2,
      3: offset3
    };
    return {
      transform: `translateX(${-speeds[layer as keyof typeof speeds]}px)`,
      willChange: 'transform'
    };
  };

  if (style === 'dynamic') {
    return (
      <div 
        className={`absolute left-0 right-0 ${flip ? 'bottom-0' : 'top-0'} overflow-hidden ${className}`}
        style={{ height: flip ? '80px' : '80px' }}
      >
        {/* Dynamic Wave Layer 1 */}
        <svg
          viewBox="0 0 1440 320"
          className="absolute w-[200%] h-full"
          style={{
            ...getSpeedStyle(1),
            opacity: 0.8
          }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.8 }} />
              <stop offset="50%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.8 }} />
            </linearGradient>
          </defs>
          <path
            d="M0,160 C180,200 360,80 540,160 C720,240 900,120 1080,160 C1260,200 1440,80 1620,160 L1620,320 L0,320 Z"
            fill="url(#waveGradient1)"
          />
        </svg>

        {/* Dynamic Wave Layer 2 */}
        <svg
          viewBox="0 0 1440 320"
          className="absolute w-[200%] h-full"
          style={{
            ...getSpeedStyle(2),
            opacity: 0.5,
            top: flip ? '10px' : '-10px'
          }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.6 }} />
            </linearGradient>
          </defs>
          <path
            d="M0,160 C240,120 480,240 720,160 C960,80 1200,200 1440,160 C1680,120 1920,240 2160,160 L2160,320 L0,320 Z"
            fill="url(#waveGradient2)"
          />
        </svg>

        {/* Dynamic Wave Layer 3 */}
        <svg
          viewBox="0 0 1440 320"
          className="absolute w-[200%] h-full"
          style={{
            ...getSpeedStyle(3),
            opacity: 0.3,
            top: flip ? '20px' : '-20px'
          }}
          preserveAspectRatio="none"
        >
          <path
            d="M0,160 C300,100 600,220 900,160 C1200,100 1500,220 1800,160 L1800,320 L0,320 Z"
            fill="var(--accent)"
          />
        </svg>
      </div>
    );
  }

  // Default smooth style
  return (
    <div 
      className={`absolute left-0 right-0 ${flip ? 'bottom-0' : 'top-0'} overflow-hidden ${className}`}
      style={{ height: flip ? '100px' : '100px' }}
    >
      {/* Smooth Wave Layer 1 - Background */}
      <svg
        viewBox="0 0 1440 200"
        className="absolute w-full h-[120%]"
        style={{
          ...getSpeedStyle(1),
          opacity: 0.3
        }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,100 C200,150 400,50 600,100 C800,150 1000,50 1200,100 C1400,150 1440,80 1440,100 L1440,200 L0,200 Z"
          fill="var(--accent)"
        />
      </svg>

      {/* Smooth Wave Layer 2 - Middle */}
      <svg
        viewBox="0 0 1440 200"
        className="absolute w-full h-[110%]"
        style={{
          ...getSpeedStyle(2),
          opacity: 0.5,
          top: flip ? '10px' : '-10px'
        }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,100 C240,140 480,60 720,100 C960,140 1200,60 1440,100 L1440,200 L0,200 Z"
          fill="var(--accent)"
        />
      </svg>

      {/* Smooth Wave Layer 3 - Foreground */}
      <svg
        viewBox="0 0 1440 200"
        className="absolute w-full h-full"
        style={{
          ...getSpeedStyle(3),
          opacity: 0.8,
          top: flip ? '20px' : '-20px'
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="smoothWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.9 }} />
            <stop offset="50%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent)', stopOpacity: 0.9 }} />
          </linearGradient>
        </defs>
        <path
          d="M0,100 C300,130 600,70 900,100 C1200,130 1440,70 1440,100 L1440,200 L0,200 Z"
          fill="url(#smoothWaveGradient)"
        />
      </svg>

      {/* Overlay gradient for smooth transition */}
      <div 
        className={`absolute inset-0 ${flip ? 'bg-gradient-to-t' : 'bg-gradient-to-b'}`}
        style={{
          background: flip 
            ? 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)'
            : 'linear-gradient(to bottom, var(--bg-base) 0%, transparent 100%)'
        }}
      />
    </div>
  );
};
