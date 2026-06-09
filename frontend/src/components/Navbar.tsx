import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useRole } from '../hooks';
import { Button, RoleBadge } from './ui';
import { toast } from '../hooks';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { canManageUsers } = useRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">R</span>
          RBAC App
        </Link>

        <div className="flex items-center gap-3">
          {canManageUsers && (
            <Link
              to="/admin/users"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              👑 Admin Panel
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.email}</span>
                <RoleBadge role={user.role} />
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
