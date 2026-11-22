import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileText, GraduationCap, ImageIcon, Settings, ShieldCheck, LogOut, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth, useRequireAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, loading, logout, username } = useAuth();

  // Require auth for all admin routes
  useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { name: '仪表盘', path: '/admin', icon: LayoutDashboard },
    { name: '文章管理', path: '/admin/posts', icon: FileText },
    { name: '教程管理', path: '/admin/tutorials', icon: GraduationCap },
    { name: '图床', path: '/admin/media', icon: ImageIcon },
    { name: '站点设置', path: '/admin/settings', icon: Settings },
    { name: '安全与系统', path: '/admin/security', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-accent">WineryBlog Admin</h1>
          <p className="text-xs text-text-muted mt-1">内容 · 教程 · 媒体 · 系统一站式管理</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-2 text-xs text-text-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            当前登录：{username || 'admin'}
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-base hover:text-text-primary transition-colors">
            <ExternalLink className="w-5 h-5" />
            返回博客
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-bg-base p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
