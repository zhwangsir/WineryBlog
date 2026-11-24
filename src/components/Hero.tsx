import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowRight, Compass, GraduationCap, Waypoints } from 'lucide-react';
import { useCareers, useLabs, useTutorials } from '../lib/catalog';

const HERO_BG_IMAGE = '/images/HuTao/hutao10.png';

interface TypewriterProps {
  text: string;
  speed?: number;
  loop?: boolean;
}

/**
 * 标题打字机：整段打完后停留，再整段淡出重打（比逐字删除更安静）。
 * 调度全部用 setTimeout——不依赖渲染帧，后台 / 被遮挡的窗口里也能继续。
 */
const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 80, loop = true }) => {
  const [shown, setShown] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!text) return;
    setShown(0);
    setFading(false);
    let timer = 0;
    let i = 0;
    const typeNext = () => {
      i += 1;
      setShown(i);
      if (i < text.length) {
        timer = window.setTimeout(typeNext, speed + Math.random() * 40);
      } else if (loop) {
        // 停留 6 秒 → 淡出 → 重新打
        timer = window.setTimeout(() => {
          setFading(true);
          timer = window.setTimeout(() => {
            i = 0;
            setShown(0);
            setFading(false);
            timer = window.setTimeout(typeNext, 350);
          }, 600);
        }, 6000);
      }
    };
    timer = window.setTimeout(typeNext, 300);
    return () => window.clearTimeout(timer);
  }, [text, speed, loop]);

  return (
    <span
      className={`inline-block transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
      aria-label={text}
    >
      {text.slice(0, shown)}
      <span aria-hidden="true" className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.08em] bg-white/90" />
    </span>
  );
};

export const Hero: React.FC = () => {
  const { config: siteConfig, posts } = useData();
  const { data: catalog } = useTutorials();
  const { data: careers } = useCareers();
  const { data: labs } = useLabs();
  const [heroImage, setHeroImage] = useState<string>(HERO_BG_IMAGE);

  useEffect(() => {
    const candidate = siteConfig?.hero.image || HERO_BG_IMAGE;
    setHeroImage(candidate);
    // if the configured image fails to load, fall back to the default banner
    const probe = new Image();
    probe.onerror = () => setHeroImage(HERO_BG_IMAGE);
    probe.src = candidate;
  }, [siteConfig?.hero.image]);

  const stats = [
    { value: posts.length || (catalog?.tutorials.length ?? 0), label: '篇教程' },
    { value: catalog?.domains.length, label: '大知识域' },
    { value: careers?.length, label: '条职业路线' },
    { value: labs?.length, label: '个实验' },
  ];

  return (
    <div className="relative flex min-h-[460px] w-full items-center justify-center overflow-hidden pt-28 pb-12 md:h-[460px] md:pt-0 md:pb-0">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-bg-base" />
      </div>

      <div className="relative z-10 flex max-w-5xl flex-col items-center px-4 text-center">
        <h1
          className="mb-4 min-h-[1.2em] text-[clamp(1.5rem,6.4vw,3.5rem)] leading-[1.25] font-bold tracking-tight text-white drop-shadow-lg [text-wrap:balance]"
        >
          <Typewriter text={siteConfig?.hero.title || ''} speed={80} />
        </h1>
        <p className="text-base font-medium text-white/90 drop-shadow-md md:text-xl">
          {siteConfig?.hero.subtitle}
        </p>

        {/* 行动入口 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 md:mt-7 md:gap-3">
          <Link
            to="/tutorials"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:-translate-y-0.5 hover:bg-accent-hover md:px-6 md:py-2.5"
          >
            <GraduationCap className="h-4 w-4" /> 进入教程中心
          </Link>
          <Link
            to="/graph"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20 md:px-6 md:py-2.5"
          >
            <Waypoints className="h-4 w-4" /> 打开知识图谱
          </Link>
          <Link
            to="/lab"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/20 md:px-6 md:py-2.5"
          >
            <Compass className="h-4 w-4" /> 去实验室
          </Link>
        </div>

        {/* 站点概览 */}
        <dl className="mt-6 grid max-w-[19rem] grid-cols-2 gap-x-8 gap-y-2 rounded-2xl border border-white/15 bg-black/30 px-6 py-3 backdrop-blur-md md:mt-7 md:flex md:max-w-none md:flex-wrap md:items-center md:justify-center md:gap-x-7 md:gap-y-2 md:rounded-full md:px-7 md:py-2.5">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline justify-center gap-1.5">
              <dd className="text-lg font-bold text-white tabular-nums">{s.value ?? '—'}</dd>
              <dt className="text-xs text-white/70">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="absolute right-4 bottom-4 z-10">
        {siteConfig?.hero.credit && (
          <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
            © {siteConfig.hero.credit}
          </div>
        )}
      </div>

      {/* 向下引导：滚过首屏看内容 */}
      <button
        type="button"
        aria-label="向下浏览"
        onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
        className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full p-2 text-white/60 transition-colors hover:text-white"
      >
        <ArrowRight className="h-5 w-5 rotate-90" />
      </button>
    </div>
  );
};
