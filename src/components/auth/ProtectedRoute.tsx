import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'lojista';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile.tipo_usuario !== requiredRole) {
    // Redirect based on user type
    if (profile.tipo_usuario === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (profile.tipo_usuario === 'lojista') {
      return <Navigate to="/lojista" replace />;
    }
  }

  return <>{children}</>;
};