import React from 'react';
import { AuthContext, useCustomAuthProvider } from '@/hooks/useCustomAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const CustomAuthProvider = ({ children }: AuthProviderProps) => {
  const authValue = useCustomAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};