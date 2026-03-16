import React from 'react';

interface WaveProps {
  className?: string;
  flip?: boolean;
}

/**
 * 波浪效果组件 - 参考 Firefly 设计
 * 
 * 使用 SVG 绘制多层波浪，每层有不同的动画速度和延迟
 * 创造出自然流畅的水波效果
 */
export const Wave: React.FC<WaveProps> = ({ 
  className = '', 
  flip = false 
}) => {
  return (
    <div 
      className={`w-full overflow-hidden ${className}`}
      style={{
        height: flip ? '100px' : '120px',
        transform: flip ? 'rotate(180deg)' : 'none',
        marginTop: flip ? '-1px' : '-100px',
        position: 'relative',
        zIndex: 10
      }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 渐变定义 */}
          <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 第一层波浪 - 最慢最淡 */}
        <path
          fill="url(#waveGradient1)"
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{
            animation: 'wave1 25s cubic-bezier(0.5, 0.5, 0.45, 0.5) infinite',
            transformOrigin: 'center bottom'
          }}
        />

        {/* 第二层波浪 - 中等速度 */}
        <path
          fill="url(#waveGradient2)"
          d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{
            animation: 'wave2 20s cubic-bezier(0.5, 0.5, 0.45, 0.5) infinite',
            animationDelay: '-5s',
            transformOrigin: 'center bottom'
          }}
        />

        {/* 第三层波浪 - 最快最浓 */}
        <path
          fill="url(#waveGradient3)"
          d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,213.3C672,203,768,213,864,229.3C960,245,1056,267,1152,261.3C1248,256,1344,224,1392,208L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{
            animation: 'wave3 15s cubic-bezier(0.5, 0.5, 0.45, 0.5) infinite',
            animationDelay: '-2s',
            transformOrigin: 'center bottom'
          }}
        />

        {/* 第四层波浪 - 最前面 */}
        <path
          fill="var(--accent)"
          fillOpacity="0.15"
          d="M0,288L48,282.7C96,277,192,267,288,272C384,277,480,299,576,288C672,277,768,235,864,224C960,213,1056,235,1152,250.7C1248,267,1344,277,1392,282.7L1440,288L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{
            animation: 'wave4 10s cubic-bezier(0.5, 0.5, 0.45, 0.5) infinite',
            animationDelay: '-3s',
            transformOrigin: 'center bottom'
          }}
        />
      </svg>

      {/* CSS 动画 */}
      <style>{`
        @keyframes wave1 {
          0% {
            transform: translateX(-90px);
          }
          100% {
            transform: translateX(85px);
          }
        }
        
        @keyframes wave2 {
          0% {
            transform: translateX(-85px);
          }
          100% {
            transform: translateX(90px);
          }
        }
        
        @keyframes wave3 {
          0% {
            transform: translateX(-80px);
          }
          100% {
            transform: translateX(95px);
          }
        }
        
        @keyframes wave4 {
          0% {
            transform: translateX(-75px);
          }
          100% {
            transform: translateX(100px);
          }
        }
      `}</style>
    </div>
  );
};
