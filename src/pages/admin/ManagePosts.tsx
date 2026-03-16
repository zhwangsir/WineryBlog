import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ManagePosts: React.FC = () => {
  const { posts, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        await refreshData();
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Posts</h1>
          <p className="text-text-secondary">Manage your blog posts.</p>
        </div>
        <Link 
          to="/admin/posts/new" 
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Post
        </Link>
      </header>

      <div className="bg-bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search posts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-base border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-base/50 text-text-secondary text-sm">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPosts.map(post => (
                <tr key={post.id} className="hover:bg-bg-base/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-text-primary line-clamp-1">{post.title}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium">
                      {post.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">{post.date}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/admin/posts/edit/${post.id}`}
                        className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-secondary">
                    No posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
