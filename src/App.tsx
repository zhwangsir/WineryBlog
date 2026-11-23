/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Archive } from './pages/Archive';
import { About } from './pages/About';
import { Friends } from './pages/Friends';
import { PostDetail } from './pages/PostDetail';
import { Tutorials } from './pages/Tutorials';
import { CareerRoute } from './pages/CareerRoute';
import { NotFound } from './pages/NotFound';
import { KnowledgeGraph } from './pages/KnowledgeGraph';
import { AIChat } from './pages/AIChat';
import { Report } from './pages/Report';
import { LabPage } from './pages/LabPage';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { ManagePosts } from './pages/admin/ManagePosts';
import { ManageTutorials } from './pages/admin/ManageTutorials';
import { ManageMedia } from './pages/admin/ManageMedia';
import { Security } from './pages/admin/Security';
import { ManageComments } from './pages/admin/ManageComments';
import { EditPost } from './pages/admin/EditPost';
import { ManageConfig } from './pages/admin/ManageConfig';

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
          <Route path="post/:id" element={<PostDetail />} />
          <Route path="learning" element={<Navigate to="/tutorials" replace />} />
          <Route path="tutorials" element={<Tutorials />} />
          <Route path="routes/:career" element={<CareerRoute />} />
          <Route path="graph" element={<KnowledgeGraph />} />
          <Route path="ai" element={<AIChat />} />
          <Route path="report" element={<Report />} />
          <Route path="lab" element={<LabPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
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
    <DataProvider>
      <Router>
        <AppContent />
      </Router>
    </DataProvider>
  );
}
