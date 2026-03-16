/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Archive } from './pages/Archive';
import { About } from './pages/About';
import { PostDetail } from './pages/PostDetail';
import { DataProvider, useData } from './context/DataContext';
import { Loader2 } from 'lucide-react';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { ManagePosts } from './pages/admin/ManagePosts';
import { EditPost } from './pages/admin/EditPost';
import { ManageConfig } from './pages/admin/ManageConfig';

const AppContent = () => {
  const { loading } = useData();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="archive" element={<Archive />} />
          <Route path="about" element={<About />} />
          <Route path="post/:id" element={<PostDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="posts" element={<ManagePosts />} />
          <Route path="posts/edit/:id" element={<EditPost />} />
          <Route path="posts/new" element={<EditPost />} />
          <Route path="settings" element={<ManageConfig />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
