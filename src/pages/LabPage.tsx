import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, AlertTriangle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useLabsData } from '../lib/labs';
import { LabHome } from '../components/lab/LabBrowse';

// 工作台带着代码编辑器，只有打开某个环境时才下载
const Workbench = React.lazy(() => import('../components/lab/Workbench'));

/**
 * 实验室：只按环境分类，URL 可以直达、可以分享
 *   /lab                       所有环境
 *   /lab?env=web               前端环境的工作台（空白练习：编辑器 + 运行结果，旁边可开关 AI 助教）
 *   /lab?env=web&exp=html-basics   同一个环境里载入了某个可选示例
 */
const LabPage: React.FC = () => {
  const [sp] = useSearchParams();
  const { data, error } = useLabsData();

  const expId = sp.get('exp');
  const envId = sp.get('env');
  const lab = data && expId ? data.labs[expId] : undefined;
  const env = data ? (lab ? data.envs.find((e) => e.id === lab.env) : envId ? data.envs.find((e) => e.id === envId) : undefined) : undefined;

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center">
        <SEO title="实验室" />
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-text-primary">实验环境加载失败</h1>
        <p className="mt-2 text-sm text-text-secondary">服务器没有返回实验数据（{error}）。稍后刷新再试；如果一直如此，在项目根目录执行 <code className="rounded bg-bg-card px-1.5 py-0.5 font-mono text-xs">npm run labs:build</code> 重新生成。</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
        <SEO title="实验室" />
        <div className="flex items-center gap-3 text-sm text-text-muted"><FlaskConical className="h-5 w-5 animate-pulse text-accent" /> 正在准备实验环境…</div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-bg-card" />)}
        </div>
      </div>
    );
  }

  if (env) {
    return (
      <React.Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center gap-3 text-sm text-text-muted"><FlaskConical className="h-5 w-5 animate-pulse text-accent" /> 正在打开实验环境…</div>}>
        <Workbench key={`${env.id}:${lab?.id ?? 'blank'}`} data={data} env={env} lab={lab} />
      </React.Suspense>
    );
  }
  return <LabHome data={data} />;
};

export { LabPage };
export default LabPage;
