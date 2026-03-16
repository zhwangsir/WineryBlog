import React from 'react';
import { useData } from '../context/DataContext';
import { FileText, Folder, Tag, Type, Clock, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export const StatsCard: React.FC = () => {
  const { config: siteConfig } = useData();
  const stats = siteConfig?.stats;

  const statItems = stats ? [
    { label: '文章', value: stats.articles, icon: FileText },
    { label: '分类', value: stats.categories, icon: Folder },
    { label: '标签', value: stats.tags, icon: Tag },
    { label: '总字数', value: stats.words, icon: Type },
  ] : [];

  const metaItems = stats ? [
    { label: '运行时长', value: `${stats.runningDays} 天`, icon: Clock },
    { label: '最后活动', value: stats.lastActivity, icon: Activity },
  ] : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-bg-card rounded-xl p-5 border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 bg-accent rounded-full" />
        <h3 className="font-bold text-text-primary">站点统计</h3>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index} 
              className="bg-bg-base rounded-lg p-3 group hover:border-accent/30 border border-transparent transition-all"
            >
              <div className="flex items-center gap-2 text-text-muted mb-1">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{item.label}</span>
              </div>
              <span className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Meta Info */}
      <div className="space-y-2 pt-3 border-t border-border/50">
        {metaItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
              <span className="text-text-secondary">{item.value}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
