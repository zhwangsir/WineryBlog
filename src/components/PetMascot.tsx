import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pickLine } from '../lib/petLines';
import { speakPetLine } from '../lib/petVoice';

interface PetMascotProps {
  enabled?: boolean;
  voiceEnabled?: boolean;
  /** 'hutao' = 本地胡桃模型；'fallback' = 跳过 Live2D 用静态头像 */
  model?: 'hutao' | 'fallback';
  /** 模型加载失败时的回落头像 */
  fallbackAvatar?: string;
  name?: string;
  /** 桌宠整体缩放（0.5-1.5，1 = 基准 220×300） */
  size?: number;
  /** 桌宠不透明度（0.3-1） */
  opacity?: number;
  /** 双击/长按打开胡桃对话面板 */
  onOpenChat?: () => void;
}

const STORE_KEY = 'winery-pet-state';
const PET_BASE = { w: 220, h: 300 };
const MARGIN = 8;

type Pos = { x: number; y: number };

function loadPos(size: number): Pos {
  const w = PET_BASE.w * size, h = PET_BASE.h * size;
  try {
    const saved = JSON.parse(localStorage.getItem(`${STORE_KEY}-pos`) || 'null');
    if (saved && typeof saved.x === 'number') return saved;
  } catch { /* ignore */ }
  return {
    x: window.innerWidth - w - 12,
    y: window.innerHeight - h - 12,
  };
}

function clampPos(p: Pos, size: number): Pos {
  const w = PET_BASE.w * size, h = PET_BASE.h * size;
  return {
    x: Math.max(MARGIN, Math.min(p.x, window.innerWidth - w - MARGIN)),
    y: Math.max(MARGIN, Math.min(p.y, window.innerHeight - h - MARGIN)),
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
  model = 'hutao',
  fallbackAvatar = '/images/HuTao/hutao68.png',
  name = '胡桃',
  size = 1,
  opacity = 1,
  onOpenChat,
}) => {
  // 归一化尺寸参数，供所有布局/边界计算使用
  const clampedSize = Math.max(0.5, Math.min(1.5, size || 1));
  const petSize = { w: Math.round(PET_BASE.w * clampedSize), h: Math.round(PET_BASE.h * clampedSize) };
  const hostRef = useRef<HTMLDivElement>(null);
  const pixiHostRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null);
  const appRef = useRef<any>(null);
  const posRef = useRef<Pos>({ x: -9999, y: -9999 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0, moved: false });
  const lastTap = useRef(0);

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
    applyPos(clampPos(loadPos(clampedSize), clampedSize));
    if (model === 'fallback') { setLive2dFailed(true); return; }   // 明确选择静态模式

    let disposed = false;
    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    const cleanupFns: (() => void)[] = [];
    (async () => {
      try {
        const PIXI = await import('pixi.js');
        const { Live2DModel } = await import('pixi-live2d-display-lipsyncpatch/cubism4');
        (window as any).PIXI = PIXI;
        Live2DModel.registerTicker(PIXI.Ticker);

        const app = new PIXI.Application({
          view: undefined,
          width: petSize.w,
          height: petSize.h,
          backgroundAlpha: 0,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          preserveDrawingBuffer: false,
          autoStart: false,              // 渲染由下方自主 rAF 循环驱动
        });
        if (disposed) { app.destroy(false); return; }
        appRef.current = app;
        // 画布不拦截指针：透明区域点击穿透到页面，交互由命中层承担
        (app.view as HTMLCanvasElement).style.pointerEvents = 'none';
        pixiHostRef.current?.appendChild(app.view as HTMLCanvasElement);

        const model = await Live2DModel.from('/live2d/hutao/HuTao.model3.json', {
          autoInteract: false,   // 点击/拖动由外层命中层处理
          autoUpdate: false,     // 由下方 ticker 手动驱动（autoUpdate 挂接在本环境失效）
        });
        if (disposed) { model.destroy(); return; }
        modelRef.current = model;
        (window as any).__petModel = model;   // 调试钩子：读取视线参数

        // 眼神跟随鼠标：全局监听（canvas 指针穿透不影响 window 级监听）
        onPointerMove = (e: PointerEvent) => {
          try { modelRef.current?.focus(e.clientX, e.clientY); } catch { /* 模型销毁窗口期 */ }
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });

        // 缩放到 260px 高，锚定底部居中
        const scale = (petSize.h - 30) / model.internalModel.height;
        model.scale.set(scale);
        model.x = (petSize.w - model.internalModel.width * scale) / 2;
        model.y = petSize.h - model.internalModel.height * scale;
        app.stage.addChild(model);

        // 自主循环：驱动 Live2D 内部更新（眨眼/物理/焦点）+ 待机呼吸 + 渲染。
        // 用 setInterval 而非 rAF —— rAF 在后台标签/嵌入式 webview 中会被节流到 0。
        const baseY = model.y;
        let last = performance.now();
        let warned = false;
        const loop = () => {
          const t = performance.now();
          const dt = Math.min(t - last, 100);
          last = t;
          try {
            model.update(dt);
            model.rotation = Math.sin(t / 1400) * 0.02;
            model.y = baseY + Math.sin(t / 900) * 3;
            app.render();
            warned = false;
          } catch (e) {
            if (!warned) { console.warn('[pet] render loop:', e); warned = true; }
          }
        };
        const loopId = window.setInterval(loop, 33);   // ≈30fps
        cleanupFns.push(() => window.clearInterval(loopId));

        setReady(true);
      } catch (e) {
        console.warn('[pet] Live2D 加载失败，回落静态头像', e);
        if (!disposed) setLive2dFailed(true);
      }
    })();

    return () => {
      disposed = true;
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
      cleanupFns.forEach(fn => fn());
      try {
        modelRef.current?.destroy();
        appRef.current?.destroy(false, { children: true });
      } catch { /* ignore */ }
      modelRef.current = null; appRef.current = null;
    };
  }, [enabled, hidden, model, applyPos]);

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

  // ---- 拖动 + 点击/双击 ----
  const onPointerDown = (e: React.PointerEvent) => {
    try { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* 合成事件无活动指针，忽略 */ }
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
      applyPos(clampPos({ x: d.baseX + dx, y: d.baseY + dy }, clampedSize));
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
    // 点击（未拖动）：快速二连击打开面板，单击出台词
    const now = Date.now();
    if (now - lastTap.current < 600) {
      lastTap.current = 0;
      (window as any).__petOpenCalls = ((window as any).__petOpenCalls || 0) + 1;
      onOpenChat?.();
      return;
    }
    (window as any).__petTapSingle = ((window as any).__petTapSingle || 0) + 1;
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
      style={{
        width: petSize.w, height: petSize.h,
        opacity: Math.max(0.3, Math.min(1, opacity || 1)),
        touchAction: 'none', cursor: 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={() => { lastTap.current = 0; onOpenChat?.(); }}
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

      {/* Live2D 画布（指针穿透） / 静态回落 */}
      <div ref={pixiHostRef} className="w-full h-full relative" data-pet-name={name} style={{ pointerEvents: 'none' }}>
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

      {/* 命中层：近似模型身体矩形，承担拖动与点击（未加载完成时不拦截） */}
      <div
        ref={hitRef}
        className="absolute z-10"
        style={{
          left: petSize.w / 2 - 60 * clampedSize,
          top: 40 * clampedSize,
          width: 120 * clampedSize,
          height: petSize.h - 50,
          pointerEvents: ready ? 'auto' : 'none',
          cursor: 'grab',
        }}
      />
    </div>
  );
};
