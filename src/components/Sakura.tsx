import React, { useEffect, useRef } from 'react';

interface SakuraProps {
  enabled?: boolean;
  density?: number;
  speed?: 'slow' | 'normal' | 'fast';
}

interface Petal {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

const COLORS = [
  '#ffc0cb', // 粉色
  '#ffb7c5', // 樱花粉
  '#ffe4e1', // 迷雾玫瑰
  '#fff0f5', // 薰衣草红
  '#ff69b4', // 热粉色
];

export const Sakura: React.FC<SakuraProps> = ({
  enabled = true,
  density = 50,
  speed = 'normal'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let petals: Petal[] = [];

    const speedMap = {
      slow: 0.3,
      normal: 0.6,
      fast: 1.0
    };

    const baseSpeed = speedMap[speed];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createPetal = (randomY = false): Petal => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -20,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      speedX: (Math.random() - 0.5) * baseSpeed,
      speedY: Math.random() * baseSpeed + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });

    const init = () => {
      resize();
      petals = Array.from({ length: density }, () => createPetal(true));
    };

    const drawPetal = (petal: Petal) => {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate((petal.rotation * Math.PI) / 180);
      ctx.globalAlpha = petal.opacity;
      ctx.fillStyle = petal.color;
      
      // 绘制樱花花瓣形状
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size / 2, petal.size, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 花瓣中心
      ctx.beginPath();
      ctx.arc(0, 0, petal.size / 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      petals.forEach((petal) => {
        // 更新位置
        petal.x += petal.speedX + Math.sin(petal.y / 50) * 0.5;
        petal.y += petal.speedY;
        petal.rotation += petal.rotationSpeed;

        // 边界处理
        if (petal.y > canvas.height + 20) {
          petal.y = -20;
          petal.x = Math.random() * canvas.width;
        }
        if (petal.x > canvas.width + 20) {
          petal.x = -20;
        }
        if (petal.x < -20) {
          petal.x = canvas.width + 20;
        }

        drawPetal(petal);
      });

      animationId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [enabled, density, speed]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
};
