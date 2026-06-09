import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useRole } from '../hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'SUPER_ADMIN' | 'MODERATOR' | 'REGULAR_USER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { isAuthenticated } = useAuthStore();
  const { role } = useRole();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole) {
    const roleHierarchy: Record<string, number> = {
      SUPER_ADMIN: 4,
      MODERATOR: 3,
      REGULAR_USER: 2,
      GUEST: 1,
    };

    if (roleHierarchy[role] < roleHierarchy[requireRole]) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
