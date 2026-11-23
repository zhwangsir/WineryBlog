/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageFallback } from './components/PageFallback';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';

// 重页面按路由懒加载：首屏（首页）不再下载图谱 / 实验室 / 编辑器 / Markdown 渲染器的代码
const lazyPage = <T,>(loader: () => Promise<T>, pick: (m: T) => React.ComponentType) =>
  lazy(() => loader().then((m) => ({ default: pick(m) })));

const Archive = lazyPage(() => import('./pages/Archive'), (m) => m.Archive);
const About = lazyPage(() => import('./pages/About'), (m) => m.About);
const Friends = lazyPage(() => import('./pages/Friends'), (m) => m.Friends);
const PostDetail = lazyPage(() => import('./pages/PostDetail'), (m) => m.PostDetail);
const Tutorials = lazyPage(() => import('./pages/Tutorials'), (m) => m.Tutorials);
const CareerRoute = lazyPage(() => import('./pages/CareerRoute'), (m) => m.CareerRoute);
const KnowledgeGraph = lazyPage(() => import('./pages/KnowledgeGraph'), (m) => m.KnowledgeGraph);
const AIChat = lazyPage(() => import('./pages/AIChat'), (m) => m.AIChat);
const LabPage = lazyPage(() => import('./pages/LabPage'), (m) => m.LabPage);

// Admin Pages
const AdminLayout = lazyPage(() => import('./pages/admin/AdminLayout'), (m) => m.AdminLayout);
const Login = lazyPage(() => import('./pages/admin/Login'), (m) => m.Login);
const Dashboard = lazyPage(() => import('./pages/admin/Dashboard'), (m) => m.Dashboard);
const ManagePosts = lazyPage(() => import('./pages/admin/ManagePosts'), (m) => m.ManagePosts);
const ManageTutorials = lazyPage(() => import('./pages/admin/ManageTutorials'), (m) => m.ManageTutorials);
const ManageMedia = lazyPage(() => import('./pages/admin/ManageMedia'), (m) => m.ManageMedia);
const Security = lazyPage(() => import('./pages/admin/Security'), (m) => m.Security);
const ManageComments = lazyPage(() => import('./pages/admin/ManageComments'), (m) => m.ManageComments);
const EditPost = lazyPage(() => import('./pages/admin/EditPost'), (m) => m.EditPost);
const ManageConfig = lazyPage(() => import('./pages/admin/ManageConfig'), (m) => m.ManageConfig);

const AppContent = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="archive" element={<Archive />} />
          <Route path="about" element={<About />} />
          <Route path="friends" element={<Friends />} />
          <Route
            path="post/:id"
            element={<ErrorBoundary label="文章页"><PostDetail /></ErrorBoundary>}
          />
          <Route path="learning" element={<Navigate to="/tutorials" replace />} />
          <Route
            path="tutorials"
            element={<ErrorBoundary label="教程中心"><Tutorials /></ErrorBoundary>}
          />
          <Route
            path="routes/:career"
            element={<ErrorBoundary label="学习路线"><CareerRoute /></ErrorBoundary>}
          />
          <Route
            path="graph"
            element={<ErrorBoundary label="知识图谱"><KnowledgeGraph /></ErrorBoundary>}
          />
          <Route path="ai" element={<ErrorBoundary label="AI 馆员"><AIChat /></ErrorBoundary>} />
          <Route path="lab" element={<ErrorBoundary label="实验室"><LabPage /></ErrorBoundary>} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ErrorBoundary label="后台">
              <AdminLayout />
            </ErrorBoundary>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="posts" element={<ManagePosts />} />
          <Route path="posts/edit/:id" element={<EditPost />} />
          <Route path="posts/new" element={<EditPost />} />
          <Route path="tutorials" element={<ManageTutorials />} />
          <Route path="media" element={<ManageMedia />} />
          <Route path="security" element={<Security />} />
          <Route path="comments" element={<ManageComments />} />
          <Route path="settings" element={<ManageConfig />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <AppContent />
          </Suspense>
        </Router>
      </DataProvider>
    </ErrorBoundary>
  );
}
