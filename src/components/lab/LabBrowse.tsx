import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, FlaskConical, Sparkles } from 'lucide-react';
import { SEO } from '../SEO';
import { LAB_ICON, labsOfEnv, type LabEnv, type LabsData } from '../../lib/labs';

const EnvIcon: React.FC<{ env: LabEnv; className?: string }> = ({ env, className }) => {
  const Icon = LAB_ICON[env.icon] || FlaskConical;
  return <Icon className={className} style={{ color: env.color }} />;
};

const EngineBadge: React.FC<{ env: LabEnv }> = ({ env }) => (
  env.runner === 'sim'
    ? <span className="inline-flex items-center gap-1 rounded-full border border-[#b07cff]/40 bg-[#b07cff]/10 px-2 py-0.5 text-[11px] font-medium text-[#a985f5]"><Sparkles className="h-3 w-3" /> AI 仿真终端</span>
    : <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400"><Cpu className="h-3 w-3" /> 浏览器里真实运行</span>
);

/**
 * 实验室首页：只按环境分类。实验室只提供环境——点开一个环境就能自由练习，
 * 每个环境附带的可选示例只是「一键载入的起始代码 + 一份参考说明」。
 */
export const LabHome: React.FC<{ data: LabsData }> = ({ data }) => {
  const total = Object.keys(data.labs).length;
  const real = data.envs.filter((e) => e.runner !== 'sim');
  const sims = data.envs.filter((e) => e.runner === 'sim');

  return (
    <>
      <SEO title="实验室" description="按方向准备的实验环境：前端、JavaScript、Python、SQL、AI 提示词在浏览器里真实运行，另有运维 / Node / Java 仿真终端；打开就能自由练习，AI 助教随时可开关" />
      <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="border-b border-border pb-8">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-accent uppercase"><FlaskConical className="h-4 w-4" /> WineryLab</p>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">实验室</h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-text-secondary">
            按方向准备好的实验环境：<span className="font-medium text-text-primary">打开就是编辑器和运行结果，想练什么由你决定</span>。
            前端、JavaScript、Python、SQL、AI 提示词都在你的浏览器里真实运行，不用装任何环境。
          </p>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {[[data.envs.length, '个环境'], [real.length, '个真实运行'], [total, '个可选示例']].map(([n, label]) => (
              <div key={label as string} className="flex items-baseline gap-1.5">
                <dd className="text-2xl font-bold tabular-nums text-text-primary">{n}</dd>
                <dt className="text-text-muted">{label as string}</dt>
              </div>
            ))}
          </dl>
        </header>

        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wide text-text-muted uppercase">在浏览器里真实运行</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {real.map((env) => <EnvCard key={env.id} env={env} data={data} />)}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold tracking-wide text-text-muted uppercase">仿真终端</h2>
          <p className="mb-4 text-sm text-text-muted">浏览器里跑不了真正的 Linux、Node 和 JVM——这些环境由站内大模型扮演：你敲命令，它按真实行为给出输出。</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sims.map((env) => <EnvCard key={env.id} env={env} data={data} />)}
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-5 rounded-2xl border border-border bg-bg-card p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          {[
            ['1', '选一个环境', '每个方向是一个环境，点开直接开始，不用先选题目。'],
            ['2', '左边写，右边看', '编辑器里有一份能跑通的起步代码，尽管改。前端实时渲染，其它语言点「运行」就看输出。'],
            ['3', '想跟着练，就载入示例', '每个环境附带几个可选示例：一键载入起始代码和一份分步参考。不用示例也完全不影响练习。'],
            ['4', '需要时打开 AI 助教', '右上角的「AI 辅助教学」随时开关。助教看得见你的代码和运行结果，默认只给提示、不直接给答案。'],
          ].map(([n, title, body]) => (
            <div key={n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">{n}</span>
              <div>
                <p className="text-[15px] font-bold text-text-primary">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{body}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
};

const EnvCard: React.FC<{ env: LabEnv; data: LabsData }> = ({ env, data }) => {
  const labs = labsOfEnv(data, env.id);
  return (
    <Link
      to={`/lab?env=${env.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/5"
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ backgroundImage: `linear-gradient(90deg, transparent, ${env.color})` }}
      />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${env.color}1f` }}>
          <EnvIcon env={env} className="h-5 w-5" />
        </span>
        <EngineBadge env={env} />
      </div>
      <h3 className="mt-3.5 text-lg font-bold text-text-primary">{env.name}</h3>
      <p className="text-sm font-medium text-text-primary/90">{env.tagline}</p>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-text-muted">{env.desc}</p>
      {labs.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border/60 pt-3">
          {labs.slice(0, 4).map((l) => (
            <li key={l.id} className="flex items-center gap-2 text-[13px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: env.color }} />
              <span className="truncate text-text-secondary">{l.title}</span>
            </li>
          ))}
          {labs.length > 4 && <li className="pl-3.5 text-xs text-text-muted">… 还有 {labs.length - 4} 个示例</li>}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between pt-4 text-[13px]">
        <span className="text-text-muted">{labs.length > 0 ? `${labs.length} 个可选示例` : '自由练习'}</span>
        <span className="flex items-center gap-1 font-medium text-accent">进入环境 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
};
