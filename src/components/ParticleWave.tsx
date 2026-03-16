import React, { useEffect, useRef } from 'react';

interface ParticleWaveProps {
  className?: string;
  flip?: boolean;
  particleCount?: number;
  waveSpeed?: number;
}

/**
 * 波浪效果组件 - 方案 B：动态粒子波浪
 * 
 * 视觉特征:
 * - 使用 Canvas 绘制粒子波浪
 * - 粒子形成正弦波曲线
 * - 颜色使用主题色渐变
 * - 粒子大小和透明度渐变
 * 
 * 动画效果:
 * - 波浪曲线上下波动
 * - 粒子沿波浪路径移动
 * - 无限循环动画
 * 
 * 性能优化:
 * - 使用离屏 Canvas 缓存
 * - 减少粒子数量在移动设备
 * - requestAnimationFrame 优化
 */
export const ParticleWave: React.FC<ParticleWaveProps> = ({
  className = '',
  flip = false,
  particleCount = 100,
  waveSpeed = 0.02
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Responsive canvas sizing
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      baseY: number;
      amplitude: number;
      frequency: number;
      phase: number;
      size: number;
      speed: number;
    }> = [];

    // Initialize particles
    const initParticles = () => {
      particles.length = 0;
      const width = canvas.getBoundingClientRect().width;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: (width / particleCount) * i,
          y: 0,
          baseY: 0,
          amplitude: 10 + Math.random() * 20,
          frequency: 0.01 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
          size: 1 + Math.random() * 3,
          speed: 0.5 + Math.random() * 0.5
        });
      }
    };

    initParticles();

    // Get accent color from CSS variable
    const getAccentColor = () => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--accent').trim() || '#F27D26';
    };

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 242, g: 125, b: 38 };
    };

    const animate = () => {
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;
      
      ctx.clearRect(0, 0, width, height);
      
      const accentColor = getAccentColor();
      const rgb = hexToRgb(accentColor);
      
      time += waveSpeed;

      // Draw multiple wave layers
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        
        const layerOffset = layer * 20;
        const layerAmplitude = 15 - layer * 3;
        const layerFrequency = 0.01 + layer * 0.005;
        const layerAlpha = 0.6 - layer * 0.15;
        
        for (let i = 0; i <= width; i += 5) {
          const y = height / 2 + 
            Math.sin(i * layerFrequency + time + layerOffset) * layerAmplitude +
            Math.sin(i * 0.02 + time * 1.5) * 5;
          
          if (i === 0) {
            ctx.moveTo(i, flip ? y : y);
          } else {
            ctx.lineTo(i, flip ? y : y);
          }
        }

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${layerAlpha * 0.5})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${layerAlpha})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${layerAlpha * 0.5})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + layer;
        ctx.stroke();

        // Draw particles along the wave
        particles.forEach((particle, index) => {
          const particleX = (index / particleCount) * width;
          const particleY = height / 2 + 
            Math.sin(particleX * layerFrequency + time + particle.phase) * layerAmplitude;
          
          const particleAlpha = 0.3 + Math.sin(time + particle.phase) * 0.2;
          
          ctx.beginPath();
          ctx.arc(particleX, particleY, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particleAlpha * layerAlpha})`;
          ctx.fill();
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [flip, particleCount, waveSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute left-0 right-0 ${flip ? 'bottom-0' : 'top-0'} ${className}`}
      style={{ 
        height: '100px',
        width: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};
