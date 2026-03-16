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
    { label: '运行时长', value: `${stats.runningDays} 天`, icon: Clock },
    { label: '最后活动', value: stats.lastActivity, icon: Activity },
  ] : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-bg-card rounded-2xl p-6 shadow-lg border border-border sticky top-24 group"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-4 bg-accent rounded-full group-hover:h-6 transition-all duration-300" />
        <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">站点统计</h3>
      </div>

      <ul className="flex flex-col gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={index} className="flex items-center justify-between text-sm group/item hover:bg-bg-base p-2 -mx-2 rounded-lg transition-colors cursor-default">
              <div className="flex items-center gap-3 text-text-secondary group-hover/item:text-accent transition-colors">
                <Icon className="w-4 h-4 text-accent" />
                <span>{item.label}</span>
              </div>
              <span className="font-bold text-text-primary group-hover/item:text-accent transition-colors">{item.value}</span>
            </li>
          );
        })}
      </ul>

      {/* Mascot Placeholder */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 pointer-events-none opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500 group-hover:-rotate-6">
        <img 
          src="/images/mascot.svg" 
          alt="Mascot" 
          className="w-full h-full object-contain drop-shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>
    </motion.div>
  );
};
