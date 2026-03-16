import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SEO } from '../components/SEO';

interface Friend {
  name: string;
  url: string;
  avatar: string;
  desc: string;
}

export const Friends: React.FC = () => {
  const { config } = useData();
  const friends: Friend[] = config?.friends || [];

  return (
    <>
      <SEO 
        title={`友链 - ${config?.title || 'WineryBlog'}`}
        description="交换友链，一起交流学习"
        author={config?.author}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-12"
      >
        <header className="flex flex-col gap-4 border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
            友链
          </h1>
          <p className="text-lg text-text-secondary">
            交换友链，一起交流学习 🚀
          </p>
        </header>

        {friends.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">暂无友链</h2>
            <p className="text-text-secondary">
              欢迎在评论区留言申请友链！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend, index) => (
              <motion.a
                key={friend.name}
                href={friend.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group bg-bg-card rounded-xl p-6 border border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-accent/20 mb-4 group-hover:border-accent/50 transition-colors">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                    }}
                  />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent transition-colors">
                  {friend.name}
                </h3>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                  {friend.desc}
                </p>
                <div className="flex items-center gap-1 text-xs text-text-muted group-hover:text-accent transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  访问博客
                </div>
              </motion.a>
            ))}
          </div>
        )}

        {/* Add Friend Section */}
        <div className="bg-bg-card rounded-xl p-8 border border-border mt-8">
          <h2 className="text-2xl font-bold text-text-primary mb-4 text-center">
            申请友链
          </h2>
          <div className="text-text-secondary text-center max-w-2xl mx-auto space-y-2">
            <p>欢迎交换友链！请在评论区留言，我会尽快添加。</p>
            <p className="text-sm">
              格式：博客名称 + 博客地址 + 头像URL + 简介
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
};
