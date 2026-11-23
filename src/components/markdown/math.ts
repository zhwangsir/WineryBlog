import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { PluggableList } from 'unified';
import 'katex/dist/katex.min.css';

// KaTeX + 字体体积较大，只在正文确实含 LaTeX 时按需加载这个模块
const math: { remark: PluggableList; rehype: PluggableList } = {
  remark: [remarkMath],
  rehype: [rehypeKatex],
};
export default math;
