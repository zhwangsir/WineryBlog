import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pickLine } from '../lib/petLines';
import { speakPetLine } from '../lib/petVoice';

interface PetMascotProps {
  enabled?: boolean;
  voiceEnabled?: boolean;
  autoDodge?: boolean;
  /** 模型加载失败时的回落头像 */
  fallbackAvatar?: string;
  name?: string;
  /** 双击/长按打开胡桃对话面板 */
  onOpenChat?: () => void;
}

const STORE_KEY = 'winery-pet-state';
const PET_SIZE = { w: 220, h: 300 };
const MARGIN = 8;

type Pos = { x: number; y: number };

function loadPos(): Pos {
  try {
    const saved = JSON.parse(localStorage.getItem(`${STORE_KEY}-pos`) || 'null');
    if (saved && typeof saved.x === 'number') return saved;
  } catch { /* ignore */ }
  return {
    x: window.innerWidth - PET_SIZE.w - 12,
    y: window.innerHeight - PET_SIZE.h - 12,
  };
}

function clampPos(p: Pos): Pos {
  return {
    x: Math.max(MARGIN, Math.min(p.x, window.innerWidth - PET_SIZE.w - MARGIN)),
    y: Math.max(MARGIN, Math.min(p.y, window.innerHeight - PET_SIZE.h - MARGIN)),
  };
}

const isHidden = () => sessionStorage.getItem(`${STORE_KEY}-hidden`) === '1';

/**
 * Live2D 胡桃桌宠：Pixi 渲染 + 拖动 + 位置记忆 + 遮挡自动避让 + 点击台词。
 * 模型加载失败时回落静态头像（保持气泡与交互）。
 */
export const PetMascot: React.FC<PetMascotProps> = ({
  enabled = true,
  voiceEnabled = false,
  autoDodge = true,
  fallbackAvatar = '/images/HuTao/hutao68.png',
  name = '胡桃',
  onOpenChat,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const pixiHostRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null);
  const appRef = useRef<any>(null);
  const posRef = useRef<Pos>({ x: -9999, y: -9999 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0, moved: false });
  const lastTap = useRef(0);
  const dodgeBusy = useRef(false);

  const [ready, setReady] = useState(false);
  const [live2dFailed, setLive2dFailed] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [hidden, setHidden] = useState(isHidden);
  const bubbleTimer = useRef<number | null>(null);

  const showBubble = useCallback((text: string, scene?: string) => {
    setBubble(text);
    if (bubbleTimer.current) window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 4500);
    speakPetLine(scene || 'tap', text, voiceEnabled);
  }, [voiceEnabled]);

  /** 把位置写回 DOM 并持久化 */
  const applyPos = useCallback((p: Pos, smooth = false) => {
    posRef.current = p;
    const el = hostRef.current;
    if (!el) return;
    el.style.transition = smooth ? 'left .6s cubic-bezier(.34,1.3,.64,1), top .6s cubic-bezier(.34,1.3,.64,1)' : 'none';
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    if (!smooth) localStorage.setItem(`${STORE_KEY}-pos`, JSON.stringify(p));
  }, []);

  // ---- 初始化：位置 + PIXI + Live2D 模型 ----
  useEffect(() => {
    if (!enabled || hidden) return;
    applyPos(clampPos(loadPos()));

    let disposed = false;
    (async () => {
      try {
        const PIXI = await import('pixi.js');
        const { Live2DModel } = await import('pixi-live2d-display-lipsyncpatch/cubism4');
        (window as any).PIXI = PIXI;
        Live2DModel.registerTicker(PIXI.Ticker);

        const app = new PIXI.Application({
          view: undefined,
          width: PET_SIZE.w,
          height: PET_SIZE.h,
          backgroundAlpha: 0,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        });
        if (disposed) { app.destroy(false); return; }
        appRef.current = app;
        pixiHostRef.current?.appendChild(app.view as HTMLCanvasElement);

        const model = await Live2DModel.from('/live2d/hutao/HuTao.model3.json', {
          autoInteract: false,   // 交互由外层统一处理（拖动/点击）
          autoUpdate: true,
        });
        if (disposed) { model.destroy(); return; }
        modelRef.current = model;

        // 缩放到 260px 高，锚定底部居中
        const scale = (PET_SIZE.h - 30) / model.internalModel.height;
        model.scale.set(scale);
        model.x = (PET_SIZE.w - model.internalModel.width * scale) / 2;
        model.y = PET_SIZE.h - model.internalModel.height * scale;
        app.stage.addChild(model);

        // 待机呼吸：轻微摆动（模型无 motion 文件，用程序动画补）
        const baseY = model.y;
        app.ticker.add(() => {
          const t = performance.now();
          model.rotation = Math.sin(t / 1400) * 0.02;
          model.y = baseY + Math.sin(t / 900) * 3;
        });

        setReady(true);
      } catch (e) {
        console.warn('[pet] Live2D 加载失败，回落静态头像', e);
        if (!disposed) setLive2dFailed(true);
      }
    })();

    return () => {
      disposed = true;
      try {
        modelRef.current?.destroy();
        appRef.current?.destroy(false, { children: true });
      } catch { /* ignore */ }
      modelRef.current = null; appRef.current = null;
    };
  }, [enabled, hidden, applyPos]);

  // ---- 开场问候 ----
  useEffect(() => {
    if (!enabled || hidden) return;
    const t = window.setTimeout(() => {
      const hour = new Date().getHours();
      showBubble(pickLine(hour >= 23 || hour < 6 ? 'night' : 'greet'), hour >= 23 || hour < 6 ? 'night' : 'greet');
    }, 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hidden]);

  // ---- 闲置闲聊 ----
  useEffect(() => {
    if (!enabled || hidden) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        const hour = new Date().getHours();
        const night = hour >= 23 || hour < 6;
        showBubble(pickLine(night ? 'night' : 'idle'), night ? 'night' : 'idle');
      }
    }, 60000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hidden]);

  // ---- 自动避让：检测遮挡可交互元素 → 滑向空闲候选位 ----
  const rectInteracts = useCallback((x: number, y: number): number => {
    let hits = 0;
    const cols = 4, rows = 5;
    for (let i = 1; i < cols; i++) {
      for (let j = 1; j < rows; j++) {
        const px = x + (PET_SIZE.w * i) / cols;
        const py = y + (PET_SIZE.h * j) / rows;
        const el = document.elementFromPoint(px, py);
        if (el && hostRef.current && !hostRef.current.contains(el)) {
          if (el.closest('a,button,input,textarea,select,[role="button"],label')) hits++;
        }
      }
    }
    return hits;
  }, []);

  const dodge = useCallback(() => {
    if (dodgeBusy.current) return;
    dodgeBusy.current = true;
    const cur = posRef.current;
    const vw = window.innerWidth, vh = window.innerHeight;
    const candidates: Pos[] = [
      { x: vw - PET_SIZE.w - 12, y: vh - PET_SIZE.h - 12 },
      { x: 12, y: vh - PET_SIZE.h - 12 },
      { x: vw - PET_SIZE.w - 12, y: 70 },
      { x: 12, y: 70 },
      { x: (vw - PET_SIZE.w) / 2, y: vh - PET_SIZE.h - 12 },
    ].map(clampPos);

    let target: Pos | null = null;
    for (const c of candidates) {
      if (Math.abs(c.x - cur.x) < 40 && Math.abs(c.y - cur.y) < 40) continue;
      if (rectInteracts(c.x, c.y) === 0) { target = c; break; }
    }
    if (target) {
      showBubble(pickLine('dodge'), 'dodge');
      // 平滑滑动 + 挥手感（快速摆动一次）
      const model = modelRef.current;
      if (model) {
        let t = 0;
        const wave = () => { t += 1; model.rotation = Math.sin(t / 3) * 0.15; if (t < 36) requestAnimationFrame(wave); else model.rotation = 0; };
        wave();
      }
      applyPos(target, true);
      localStorage.setItem(`${STORE_KEY}-pos`, JSON.stringify(target));
    } else {
      // 无处可去：贴边半透明
      const el = hostRef.current;
      if (el) el.style.opacity = '0.35';
    }
    window.setTimeout(() => { dodgeBusy.current = false; }, 800);
  }, [applyPos, rectInteracts, showBubble]);

  useEffect(() => {
    if (!enabled || hidden || !autoDodge || !ready) return;
    const timer = window.setInterval(() => {
      const el = hostRef.current;
      if (!el || dragState.current.dragging) return;
      if (rectInteracts(posRef.current.x, posRef.current.y) >= 2) dodge();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [enabled, hidden, autoDodge, ready, rectInteracts, dodge]);

  // ---- 拖动 + 点击/双击 ----
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragState.current = {
      dragging: true,
      startX: e.clientX, startY: e.clientY,
      baseX: posRef.current.x, baseY: posRef.current.y,
      moved: false,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) {
      applyPos(clampPos({ x: d.baseX + dx, y: d.baseY + dy }));
      const model = modelRef.current;
      if (model) model.rotation = Math.max(-0.25, Math.min(0.25, dx / 200)); // 拖动倾斜
    }
  };
  const onPointerUp = () => {
    const d = dragState.current;
    if (!d.dragging) return;
    d.dragging = false;
    const model = modelRef.current;
    if (model) model.rotation = 0;

    if (d.moved) {
      showBubble(pickLine('drag'), 'drag');
      return;
    }
    // 点击（未拖动）：双击开面板，单击台词
    const now = Date.now();
    if (now - lastTap.current < 350) {
      lastTap.current = 0;
      onOpenChat?.();
      return;
    }
    lastTap.current = now;
    showBubble(pickLine('tap'), 'tap');
  };

  const restore = () => {
    sessionStorage.removeItem(`${STORE_KEY}-hidden`);
    setHidden(false);
  };

  if (!enabled) return null;

  if (hidden) {
    return (
      <button
        onClick={restore}
        className="fixed bottom-4 right-4 z-[900] w-11 h-11 rounded-full bg-bg-card border border-border shadow-lg flex items-center justify-center text-xl hover:scale-110 transition-transform"
        title="唤醒胡桃"
      >
        🌸
      </button>
    );
  }

  return (
    <div
      ref={hostRef}
      className="fixed z-[900] select-none"
      style={{ width: PET_SIZE.w, height: PET_SIZE.h, touchAction: 'none', cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* 台词气泡 */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-[85%] w-max max-w-[240px] px-3 py-2 rounded-xl bg-white/95 dark:bg-bg-card/95 backdrop-blur text-[13px] leading-relaxed text-gray-800 dark:text-text-primary shadow-lg border border-orange-200/60"
            style={{ pointerEvents: 'none' }}
          >
            {bubble}
            <span className="absolute left-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-inherit border-r border-b border-orange-200/60 translate-x-[-50%]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 隐藏按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); sessionStorage.setItem(`${STORE_KEY}-hidden`, '1'); setHidden(true); }}
        className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-bg-card/90 border border-border text-text-muted text-[10px] flex items-center justify-center hover:text-red-500 hover:border-red-300 transition-colors"
        title="收起桌宠"
        onPointerDown={(e) => e.stopPropagation()}
      >
        ×
      </button>

      {/* Live2D 画布 / 静态回落 */}
      <div ref={pixiHostRef} className="w-full h-full relative" data-pet-name={name}>
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200/70 shadow-lg animate-bounce">
              <img src={live2dFailed ? fallbackAvatar : '/images/default-avatar.svg'} alt={name} className="w-full h-full object-cover" draggable={false} />
            </div>
            {live2dFailed && (
              <span className="mt-1 text-[10px] text-text-muted">模型离线 · PNG 模式</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
