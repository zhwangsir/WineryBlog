import React from 'react';
import { Link } from 'react-router-dom';
import type { ElementType } from 'react';
import { ArrowRight } from 'lucide-react';

interface SectionTitleProps {
  icon: ElementType;
  title: string;
  subtitle?: string;
  /** 右侧动作（如「查看全部 →」） */
  to?: string;
  action?: React.ReactNode;
}

/** 首页 / 列表页统一的分区标题：图标 + 标题 + 一句说明 + 右侧动作 */
export const SectionTitle: React.FC<SectionTitleProps> = ({ icon: Icon, title, subtitle, to, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-xl font-bold text-text-primary sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
    </div>
    {to && (
      <Link to={to} className="group inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover">
        查看全部 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    )}
    {action}
  </div>
);
