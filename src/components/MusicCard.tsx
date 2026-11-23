import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music2, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';


interface Track {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  url: string;
}

/**
 * 资料卡下方音乐播放卡：黑胶唱片样式，歌单来自 /api/music（本站本地上传音频，零外跳）。
 * 音频状态用 ref 持有单例 <audio>，切换页面不打断播放。
 */
export const MusicCard: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/music').then(r => r.json()).then((list: Track[]) => {
      const valid = (list || []).filter(t => t.url);
      setTracks(valid);
      if (valid.length) {
        // 单例音频元素挂在 window，跨页面持续
        const w = window as any;
        if (!w.__musicAudio) {
          const a = new Audio(valid[0].url);
          a.volume = 0.6;
          w.__musicAudio = a;
        }
        const a = w.__musicAudio as HTMLAudioElement;
        const idx = valid.findIndex(t => t.url === a.src.split('/').pop() || a.src.endsWith(t.url));
        setCurrent(idx >= 0 ? idx : 0);
        setPlaying(!a.paused);
        a.ontimeupdate = () => {
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
          setDuration(a.duration || 0);
        };
        a.onended = () => {
          // 自动下一曲
          const w2 = window as any;
          const list2 = (window as any).__musicList as Track[] | undefined;
          if (list2 && list2.length > 1) {
            const next = (currentRef.current + 1) % list2.length;
            currentRef.current = next;
            a.src = list2[next].url;
            a.play().catch(() => {});
          } else {
            setPlaying(false);
          }
        };
        (window as any).__musicList = valid;
      }
    }).catch(() => {});
  }, []);

  const currentRef = useRef(0);
  useEffect(() => { currentRef.current = current; }, [current]);

  const play = useCallback((idx: number) => {
    const w = window as any;
    const a = w.__musicAudio as HTMLAudioElement;
    if (!a) return;
    if (a.src !== tracks[idx].url) a.src = tracks[idx].url;
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    setCurrent(idx);
  }, [tracks]);

  const toggle = () => {
    const a = (window as any).__musicAudio as HTMLAudioElement | undefined;
    if (!a || !tracks.length) return;
    if (a.paused) { a.src = a.src || tracks[current].url; a.play().then(() => setPlaying(true)).catch(() => {}); }
    else { a.pause(); setPlaying(false); }
  };

  const skip = (dir: 1 | -1) => {
    if (tracks.length < 2) return;
    play((current + dir + tracks.length) % tracks.length);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (window as any).__musicAudio as HTMLAudioElement | undefined;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  const t = tracks[current];
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (!tracks.length) {
    return (
      <div className="bg-bg-card rounded-2xl p-5 card-shadow border border-border/50 flex flex-col items-center gap-2 text-center">
        <Music2 className="w-6 h-6 text-text-muted" />
        <p className="text-xs text-text-muted">音乐卡片待配置</p>
        <Link to="/admin/media" className="text-[11px] text-accent hover:underline">去后台「图床 → 音乐歌单」上传歌曲</Link>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-2xl p-4 card-shadow border border-border/50 flex flex-col items-center gap-3">
      {/* 黑胶唱片 */}
      <button onClick={toggle} className="relative w-24 h-24 group" title={playing ? '暂停' : '播放'}>
        <div className={`absolute inset-0 rounded-full overflow-hidden shadow-lg ${playing ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
          <img
            src={t?.cover || '/images/default-vinyl.svg'}
            alt={t?.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          />
          {/* 黑胶纹理遮罩 */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'repeating-radial-gradient(circle at center, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 2px, transparent 4px)',
          }} />
          {/* 唱片中心孔 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-bg-card border-2 border-accent" />
        </div>
        {/* 播放/暂停悬浮 */}
        <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          {playing ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
        </div>
      </button>

      {/* 曲目信息 */}
      <div className="w-full text-center min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{t?.title}</p>
        <p className="text-xs text-text-muted truncate">{t?.artist}</p>
      </div>

      {/* 进度条 */}
      <div className="w-full px-1">
        <div className="h-1.5 bg-bg-base rounded-full cursor-pointer" onClick={seek}>
          <div className="h-full bg-accent rounded-full relative" style={{ width: `${progress}%` }}>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-accent" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>{fmt(progress / 100 * duration)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* 控制行 */}
      <div className="flex items-center gap-4">
        <button onClick={() => skip(-1)} className="text-text-secondary hover:text-accent transition-colors" title="上一首">
          <SkipBack className="w-4 h-4" />
        </button>
        <button onClick={toggle} className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors shadow-md" title={playing ? '暂停' : '播放'}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button onClick={() => skip(1)} className="text-text-secondary hover:text-accent transition-colors" title="下一首">
          <SkipForward className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const a = (window as any).__musicAudio as HTMLAudioElement | undefined;
            if (!a) return;
            a.muted = !a.muted;
            setMuted(a.muted);
          }}
          className="text-text-muted hover:text-accent transition-colors"
          title={muted ? '取消静音' : '静音'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
