import React, { useEffect, useRef } from 'react';

interface Firefly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaDirection: number;
  phase: number;
}

export const FireflyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let fireflies: Firefly[] = [];
    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createFirefly = (): Firefly => ({
      id: Math.random(),
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      alphaDirection: Math.random() > 0.5 ? 1 : -1,
      phase: Math.random() * Math.PI * 2,
    });

    const init = () => {
      resize();
      fireflies = Array.from({ length: 15 }, createFirefly);
    };

    const drawFirefly = (f: Firefly) => {
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 4);
      glow.addColorStop(0, `rgba(255, 200, 100, ${f.alpha})`);
      glow.addColorStop(0.3, `rgba(255, 180, 80, ${f.alpha * 0.5})`);
      glow.addColorStop(1, 'rgba(255, 150, 50, 0)');

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 200, ${f.alpha})`;
      ctx.fill();
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireflies.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;

        f.alpha += f.alphaDirection * 0.005;
        if (f.alpha >= 0.7 || f.alpha <= 0.1) {
          f.alphaDirection *= -1;
        }

        if (f.x < 0) f.x = canvas.width;
        if (f.x > canvas.width) f.x = 0;
        if (f.y < 0) f.y = canvas.height;
        if (f.y > canvas.height) f.y = 0;

        drawFirefly(f);
      });

      animationId = requestAnimationFrame(animate);
    };

    init();
    animate(0);

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-2]"
    />
  );
};
