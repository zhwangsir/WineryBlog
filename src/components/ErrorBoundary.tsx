import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** 出错时展示的名字（如「文章页」） */
  label?: string;
}
interface ErrorBoundaryState { error: Error | null }

/**
 * 错误边界：任何页面渲染出错都不再整站白屏，就地给出说明与重试。
 * 根部一个（兜底），重页面（图谱 / 实验室 / 文章）各自一个（出错只影响本页）。
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label || 'page', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500" strokeWidth={1.2} />
        <h1 className="text-2xl font-bold text-text-primary">{this.props.label || '页面'}出了点问题</h1>
        <p className="max-w-md text-sm text-text-secondary">
          渲染过程中发生了错误，其余页面不受影响。可以重试，或回到首页 / 教程中心。
        </p>
        <p className="max-w-md truncate rounded-lg bg-bg-card px-3 py-1.5 font-mono text-xs text-text-muted">
          {this.state.error.message}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <RotateCcw className="h-4 w-4" /> 重试
          </button>
          <a href="/" className="rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">
            回首页
          </a>
          <a href="/tutorials" className="rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent/50 hover:text-accent">
            去教程中心
          </a>
        </div>
      </div>
    );
  }
}
