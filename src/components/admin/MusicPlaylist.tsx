import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music2, Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, Music } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface Track {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  url: string;
}

/** 后台音乐歌单编辑器：资料卡音乐卡片的数据源管理（音频经上传按钮入歌单） */
export const MusicPlaylistSection: React.FC<{ onUploadDone?: (url: string) => void }> = () => {
  const [list, setList] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/music');
      if (r.ok) setList(await r.json());
    } catch { /* 静默 */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (t: string) => { setNote(t); window.setTimeout(() => setNote(null), 3000); };

  const update = (i: number, field: keyof Track, value: string) => {
    setList(prev => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };
  const addRow = (url = '') => {
    setList(prev => [...prev, { id: `m-${Date.now().toString(36)}-${prev.length}`, title: '', artist: '', url }]);
  };
  const remove = (i: number) => setList(prev => prev.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    setList(prev => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = async () => {
    const valid = list.filter(t => t.title.trim() && t.url.trim());
    if (valid.length !== list.length) { flash('有行缺少标题或音频地址'); return; }
    setSaving(true);
    try {
      const r = await apiFetch('/api/music', { method: 'PUT', body: JSON.stringify(valid) });
      const d = await r.json();
      flash(d.success ? `✅ 歌单已保存（${d.count} 首），前台资料卡音乐卡片即时生效` : '保存失败');
      if (d.success) await load();
    } catch { flash('保存失败'); }
    setSaving(false);
  };

  return (
    <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Music className="w-5 h-5 text-accent" />
          音乐歌单
        </h2>
        <button
          onClick={() => addRow()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> 添加歌曲
        </button>
      </div>
      <p className="text-xs text-text-muted mb-4">
        资料卡下方「音乐卡片」的数据源：先用上方「上传图片」按钮（支持 mp3/wav/ogg）上传音频，再在这里填入标题与音频地址保存。
      </p>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
      ) : list.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">歌单为空——点「添加歌曲」或先上传音频文件。</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((t, i) => (
            <div key={t.id || i} className="grid grid-cols-[24px_1fr_1fr_2fr_auto] gap-2 items-center bg-bg-base rounded-xl p-2.5 border border-border">
              <span className="text-xs text-text-muted text-center">{i + 1}</span>
              <input
                value={t.title}
                onChange={e => update(i, 'title', e.target.value)}
                placeholder="歌曲名"
                className="px-2.5 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
              />
              <input
                value={t.artist}
                onChange={e => update(i, 'artist', e.target.value)}
                placeholder="歌手"
                className="px-2.5 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
              />
              <input
                value={t.url}
                onChange={e => update(i, 'url', e.target.value)}
                placeholder="音频地址（/uploads/xxx.mp3 或自建网易云代理地址）"
                className="px-2.5 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent font-mono text-xs"
              />
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} title="上移" className="p-1.5 text-text-muted hover:text-accent disabled:opacity-30 transition-colors"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move(i, 1)} disabled={i === list.length - 1} title="下移" className="p-1.5 text-text-muted hover:text-accent disabled:opacity-30 transition-colors"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(i)} title="删除" className="p-1.5 text-text-muted hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {note && <p className="mt-3 text-sm text-accent flex items-center gap-1.5"><Music2 className="w-4 h-4" />{note}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || list.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存歌单
        </button>
        <span className="text-[11px] text-text-muted">保存后前台资料卡音乐卡片即时生效</span>
      </div>
    </section>
  );
};

// 兼容旧命名
export const MusicPlaylist = MusicPlaylistSection;
export default MusicPlaylist;
