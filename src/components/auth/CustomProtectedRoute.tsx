import React from 'react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType?: 'admin' | 'lojista';
}

export const CustomProtectedRoute = ({ children, requiredType }: ProtectedRouteProps) => {
  const { user, loading } = useCustomAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redireciona para login baseado no tipo necessário
    if (requiredType === 'lojista') {
      return <Navigate to="/login-lojista" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requiredType && user.tipo !== requiredType) {
    // Redirect based on user type
    if (user.tipo === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.tipo === 'lojista') {
      return <Navigate to="/lojista" replace />;
    }
  }

  return <>{children}</>;
};