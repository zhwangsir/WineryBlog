import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Ghost, ArrowLeft, Compass } from 'lucide-react';
import { SEO } from '../components/SEO';

export const NotFound: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col items-center justify-center gap-6 py-28 text-center"
  >
    <SEO title="页面不存在" description="你要找的页面不在这里" />
    <Ghost className="w-16 h-16 text-text-muted" strokeWidth={1.2} />
    <div>
      <h1 className="text-6xl font-bold tracking-tight text-text-primary">404</h1>
      <p className="text-lg text-text-secondary mt-3">
        这一页被往生堂超度了——它不在站内的任何书架上。
      </p>
    </div>
    <div className="flex items-center gap-3 mt-2">
      <Link
        to="/"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bg-card border border-border text-sm font-medium text-text-secondary hover:text-accent hover:border-accent/50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 回首页
      </Link>
      <Link
        to="/tutorials"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        <Compass className="w-4 h-4" /> 去教程中心
      </Link>
    </div>
  </motion.div>
);
