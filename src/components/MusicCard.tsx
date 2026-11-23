import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music2, Volume2, VolumeX, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 资料卡音乐卡片：官方网易云播放器遥控（ncm-cli 官方 CLI，实名账号授权）。
 * - 轮询 /api/netease/state：同步你电脑上正在播放的歌（歌名/进度/播放状态）
 * - 控制按钮 → 服务端转发官方 CLI（pause/next/prev/volume）
 * - 黑胶唱片播放时旋转；无播放时回落本地上传歌单（/api/music）
 */
export const MusicCard: React.FC = () => {
  // 官方播放器状态
  const [np, setNp] = useState<{
    status: string; title?: string; position?: number; duration?: number;
  } | null>(null);
  const [npError, setNpError] = useState(false);
  const [muted, setMuted] = useState(false);
  // 本地歌单回落
  const [localTracks, setLocalTracks] = useState<{ title: string; artist: string; url: string }[]>([]);
  const [localIdx, setLocalIdx] = useState(0);
  const [localPlaying, setLocalPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadLocal = useCallback(() => {
    fetch('/api/music').then(r => r.json()).then((list: any[]) => {
      setLocalTracks((list || []).filter(t => t.url));
    }).catch(() => {});
  }, []);
  useEffect(() => { loadLocal(); }, [loadLocal]);

  // 官方状态轮询（2.5s）
  useEffect(() => {
    let dead = false;
    const poll = async () => {
      try {
        const r = await fetch('/api/netease/state');
        if (r.ok) {
          const j = await r.json();
          if (!dead) { setNp(j.state || { status: 'stopped' }); setNpError(false); }
        } else if (!dead) setNpError(true);
      } catch { if (!dead) setNpError(true); }
    };
    poll();
    const iv = window.setInterval(poll, 2500);
    return () => { dead = true; window.clearInterval(iv); };
  }, []);

  // 本地歌单音频单例（跨页面持续）
  const audioRefGet = () => {
    const w = window as any;
    if (!w.__localAudio) { const a = new Audio(); a.volume = 0.6; w.__localAudio = a; }
    return w.__localAudio as HTMLAudioElement;
  };

  const localPlay = (idx: number) => {
    if (!localTracks.length) return;
    const a = audioRefGet();
    const i = ((idx % localTracks.length) + localTracks.length) % localTracks.length;
    if (a.src !== location.origin + localTracks[i].url) a.src = localTracks[i].url;
    a.play().then(() => { setLocalPlaying(true); setLocalIdx(i); }).catch(() => {});
  };
  const localToggle = () => {
    const a = audioRefGet();
    if (localPlaying) { a.pause(); setLocalPlaying(false); }
    else localPlay(localIdx);
  };

  // 官方控制
  const control = async (action: string, value?: number) => {
    try {
      await fetch('/api/netease/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
    } catch { /* 静默 */ }
  };

  // 官方模式判定：播放器有活动（playing / 有队列）→ 官方遥控优先
  const officialActive = np && (np.status === 'playing' || np.status === 'paused' || (np.duration ?? 0) > 0);
  const usingOfficial = officialActive || localTracks.length === 0;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (usingOfficial) {
    const playing = np?.status === 'playing';
    const pos = np?.position ?? 0;
    const dur = np?.duration ?? 0;
    const pct = dur > 0 ? (pos / dur) * 100 : 0;
    const stopped = np?.status === 'stopped' || !np?.title;

    return (
      <div className="bg-bg-card rounded-2xl p-4 card-shadow border border-border/50 flex flex-col items-center gap-3">
        {/* 黑胶唱片 */}
        <button
          onClick={() => control(playing ? 'pause' : 'resume')}
          className="relative w-24 h-24 group"
          title={playing ? '暂停' : '播放'}
        >
          <div className={`absolute inset-0 rounded-full overflow-hidden shadow-lg border-4 border-bg-base ${playing ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
            <div className="w-full h-full" style={{
              background: 'radial-gradient(circle, #2a2a30 0%, #14141a 60%, #0a0a0e 100%)',
            }} />
            <div className="absolute inset-0 rounded-full" style={{
              background: 'repeating-radial-gradient(circle at center, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 4px)',
            }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-accent" />
          </div>
          <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            {playing ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
          </div>
        </button>

        <div className="w-full text-center min-w-0">
          {stopped ? (
            <>
              <p className="text-sm font-medium text-text-primary">网易云播放器</p>
              <p className="text-xs text-text-muted mt-0.5">在你电脑上用网易云放一首歌，这里会同步</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-text-primary truncate">{np?.title || '网易云播放器'}</p>
              <p className="text-xs text-text-muted mt-0.5">{playing ? '正在播放' : '已暂停'} · 网易云官方</p>
            </>
          )}
        </div>

        {/* 进度条（点击跳转） */}
        {!stopped && (
          <div className="w-full px-1">
            <div className="h-1.5 bg-bg-base rounded-full cursor-pointer" onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const sec = ((e.clientX - rect.left) / rect.width) * dur;
              control('seek', sec);
            }}>
              <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>{fmt(pos)}</span><span>{fmt(dur)}</span>
            </div>
          </div>
        )}

        {/* 控制 */}
        <div className="flex items-center gap-4">
          <button onClick={() => control('prev')} className="text-text-secondary hover:text-accent transition-colors" title="上一首">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => control(playing ? 'pause' : 'resume')}
            className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors shadow-md"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button onClick={() => control('next')} className="text-text-secondary hover:text-accent transition-colors" title="下一首">
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              const next = !muted;
              setMuted(next);
              await control('volume', next ? 0 : 60);
            }}
            className="text-text-muted hover:text-accent transition-colors"
            title={muted ? '取消静音' : '静音'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[10px] text-text-muted flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          遥控你电脑上的网易云官方播放器（实名授权）
          {!npError && <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />}
        </p>
      </div>
    );
  }

  // 本地歌单回落模式
  const t = localTracks[localIdx];
  return (
    <div className="bg-bg-card rounded-2xl p-4 card-shadow border border-border/50 flex flex-col items-center gap-3">
      <button onClick={localToggle} className="relative w-24 h-24 group" title={localPlaying ? '暂停' : '播放'}>
        <div className={`absolute inset-0 rounded-full overflow-hidden shadow-lg ${localPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
          <Music2 className="w-10 h-10 text-text-muted absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute inset-0 rounded-full" style={{
            background: 'repeating-radial-gradient(circle at center, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 4px)',
          }} />
        </div>
      </button>
      <div className="w-full text-center min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{t?.title || '本地歌单'}</p>
        <p className="text-xs text-text-muted truncate">{t?.artist || '本地播放模式'}</p>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => localPlay(localIdx - 1)} className="text-text-secondary hover:text-accent transition-colors" title="上一首"><SkipBack className="w-4 h-4" /></button>
        <button onClick={localToggle} className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors shadow-md">
          {localPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button onClick={() => localPlay(localIdx + 1)} className="text-text-secondary hover:text-accent transition-colors" title="下一首"><SkipForward className="w-4 h-4" /></button>
      </div>
      <Link to="/admin/media" className="text-[11px] text-accent hover:underline">管理歌单</Link>
    </div>
  );
};
