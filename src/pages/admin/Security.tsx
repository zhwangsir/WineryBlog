import React, { useEffect, useState } from 'react';
import { KeyRound, Download, ShieldCheck, Cpu, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface GateResult {
  at: number;
  code: number;
  output: string;
  cached?: boolean;
}
interface SysInfo {
  uptimeSec: number;
  rssMB: number;
  node: string;
  platform: string;
}

export const Security: React.FC = () => {
  // 改密码
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);

  // 门禁
  const [gate, setGate] = useState<GateResult | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  // 备份
  const [backupBusy, setBackupBusy] = useState(false);

  // 系统
  const [sys, setSys] = useState<SysInfo | null>(null);

  const loadSystem = async () => {
    try {
      const res = await apiFetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setSys(data.system);
      }
    } catch { /* 静默 */ }
  };

  const loadGate = async (force = false) => {
    setGateBusy(true);
    try {
      const res = await apiFetch(`/api/admin/gate${force ? '?force=1' : ''}`);
      if (res.ok) setGate(await res.json());
    } catch { /* 静默 */ }
    setGateBusy(false);
  };

  useEffect(() => {
    loadSystem();
    loadGate(false);   // 优先读 5 分钟缓存，不阻塞页面
  }, []);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 8) {
      setPwdMsg({ ok: false, text: '新密码至少需要 8 位，建议混合字母、数字与符号' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: '两次输入的新密码不一致' });
      return;
    }
    setPwdBusy(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      if (res.ok) {
        setPwdMsg({ ok: true, text: '密码修改成功，下次登录使用新密码' });
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      } else {
        const err = await res.json().catch(() => ({}));
        setPwdMsg({ ok: false, text: (err as any).error || '修改失败' });
      }
    } catch {
      setPwdMsg({ ok: false, text: '网络错误' });
    }
    setPwdBusy(false);
  };

  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      const res = await apiFetch('/api/admin/backup');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wineryblog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* 静默 */ }
    setBackupBusy(false);
  };

  const fmtUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d} 天 ${h} 时` : h > 0 ? `${h} 时 ${m} 分` : `${m} 分`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-text-primary mb-2">安全与系统</h1>
        <p className="text-text-secondary">账户密码、数据备份、零外跳门禁与服务运行状态。</p>
      </header>

      {/* 修改密码 */}
      <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-accent" />
          修改管理员密码
        </h2>
        <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">当前密码</label>
            <input
              type="password"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              required
              autoComplete="current-password"
              className="px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">新密码（≥6 位）</label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              required
              autoComplete="new-password"
              className="px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">确认新密码</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                required
                autoComplete="new-password"
                className="flex-1 px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={pwdBusy}
                className="px-5 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {pwdBusy ? '提交中…' : '修改密码'}
              </button>
            </div>
          </div>
        </form>
        {pwdMsg && (
          <p className={`mt-3 text-sm flex items-center gap-1.5 ${pwdMsg.ok ? 'text-green-500' : 'text-red-500'}`}>
            {pwdMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {pwdMsg.text}
          </p>
        )}
      </section>

      {/* 数据备份 */}
      <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-500" />
          数据备份
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          打包下载站点配置、全量文章（含 210 篇教程）、访客学习进度与教程元数据，单文件 JSON 便于归档与迁移。
        </p>
        <button
          onClick={downloadBackup}
          disabled={backupBusy}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/10 text-purple-500 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {backupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {backupBusy ? '打包中…' : '下载整包备份'}
        </button>
      </section>

      {/* 零外跳门禁 */}
      <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            零外跳门禁
          </h2>
          <button
            onClick={() => loadGate(true)}
            disabled={gateBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gateBusy ? 'animate-spin' : ''}`} />
            重新扫描
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          全站扫描 Markdown 源文件与 posts.json 中的出站链接（内联链接 / 引用定义 / 自动链接 / HTML 锚点 / 裸 URL），确保读者任何点击都不出站。
        </p>
        {gate ? (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${gate.code === 0 ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
              {gate.code === 0 ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {gate.code === 0 ? '门禁通过：全站 0 个出站链接' : `门禁发现违规（exit ${gate.code}）`}
              {gate.cached && <span className="text-xs opacity-70 font-normal">（缓存结果，点「重新扫描」获取最新）</span>}
              <span className="text-xs opacity-60 font-normal ml-auto">{new Date(gate.at).toLocaleTimeString()}</span>
            </div>
            {gate.output && (
              <pre className="p-4 bg-bg-base border border-border rounded-xl text-[11px] leading-relaxed text-text-secondary overflow-auto max-h-48 font-mono">
                {gate.output}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">{gateBusy ? '扫描中…' : '尚无扫描结果'}</p>
        )}
      </section>

      {/* 系统信息 */}
      <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          服务运行状态
        </h2>
        {sys ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '运行时长', value: fmtUptime(sys.uptimeSec) },
              { label: '内存占用', value: `${sys.rssMB} MB` },
              { label: 'Node 版本', value: sys.node },
              { label: '平台', value: sys.platform },
            ].map((it, i) => (
              <div key={i} className="px-4 py-3 rounded-xl bg-bg-base border border-border">
                <p className="text-xs text-text-muted">{it.label}</p>
                <p className="text-sm font-bold text-text-primary mt-1">{it.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">加载中…</p>
        )}
      </section>
    </div>
  );
};
