import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { Button, Pagination, RoleBadge } from '../components/ui';
import { useRole, toast } from '../hooks';
import { useAuthStore } from '../stores/authStore';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}

const AdminUsers: React.FC = () => {
  const { canManageUsers } = useRole();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaginatedUsers | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canManageUsers) {
      navigate('/');
      return;
    }
    loadUsers(1);
  }, [canManageUsers]);

  const loadUsers = async (page: number) => {
    setLoading(true);
    try {
      const data = await usersApi.getAll(page);
      setResult(data);
      setCurrentPage(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("You can't delete yourself");
      return;
    }
    if (!confirm(`Delete user ${user.email}? This will also delete all their posts and comments.`)) return;
    setDeletingId(user.id);
    try {
      await usersApi.delete(user.id);
      toast.success(`User ${user.email} deleted`);
      loadUsers(currentPage);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  if (!canManageUsers) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Super Admin only — {result?.total ?? 0} users in the system
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {!loading && result && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.data.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${user.id === currentUser?.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{user.email}</div>
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-blue-600 font-medium">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.id !== currentUser?.id ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user)}
                        loading={deletingId === user.id}
                        aria-label={`Delete user ${user.email}`}
                      >
                        Delete
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Cannot delete self</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={result.totalPages}
                onPageChange={loadUsers}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
