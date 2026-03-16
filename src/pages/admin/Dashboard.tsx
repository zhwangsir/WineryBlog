import React from 'react';
import { useData } from '../../context/DataContext';
import { FileText, Folder, Tag, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { posts, categories, tags, config } = useData();

  const stats = [
    { label: 'Total Posts', value: posts.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Categories', value: categories.length, icon: Folder, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Tags', value: tags.length, icon: Tag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Running Days', value: config?.stats.runningDays || 0, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
        <p className="text-text-secondary">Welcome back to WineryBlog Admin.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text-primary mb-4">Recent Posts</h2>
        <div className="flex flex-col gap-4">
          {posts.slice(0, 5).map(post => (
            <div key={post.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-base border border-border hover:border-accent/50 transition-colors">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-text-primary">{post.title}</h3>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.category}</span>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-text-secondary text-center py-4">No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
