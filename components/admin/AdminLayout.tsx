import React, { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../services/adminService';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#532418]"></div>
      </div>
    );
  }

  // Check admin access
  if (!user || !isAdmin(user.email)) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/segments', label: 'Segmente', icon: '🎯' },
    { path: '/admin/users', label: 'User', icon: '👥' },
    { path: '/admin/feedback', label: 'Feedback', icon: '💬' },
    { path: '/admin/waitlist', label: 'Waitlist', icon: '📋' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#532418] text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-[#67534F] rounded"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'block' : 'hidden'}
            lg:block
            fixed lg:static
            inset-y-0 left-0
            z-40
            w-64 bg-[#532418] text-white
            min-h-screen
            pt-4 lg:pt-0
          `}
        >
          {/* Desktop Logo */}
          <div className="hidden lg:block p-6 border-b border-[#67534F]">
            <Link to="/" className="text-xl font-bold hover:text-[#C8956C]">
              stoffanprobe.de
            </Link>
            <p className="text-sm text-gray-300 mt-1">Admin Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="mt-6 lg:mt-0 lg:pt-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-6 py-3 text-sm font-medium
                  transition-colors duration-200
                  ${
                    isActive(item.path)
                      ? 'bg-[#67534F] text-white border-r-4 border-[#C8956C]'
                      : 'text-gray-300 hover:bg-[#67534F] hover:text-white'
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Back to App */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#67534F]">
            <Link
              to="/"
              className="flex items-center justify-center px-4 py-2 bg-[#C8956C] text-white rounded hover:bg-[#b8855c] transition-colors"
            >
              ← Zurück zur App
            </Link>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
