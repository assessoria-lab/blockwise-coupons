import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin';
}

interface LojistaUser {
  id: string;
  nome_loja: string;
  nome_responsavel?: string;
  email: string;
  tipo: 'lojista';
}

type User = AdminUser | LojistaUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInAdmin: (email: string, password: string) => Promise<{ success: boolean }>;
  signInLojista: (email: string, password: string) => Promise<{ success: boolean }>;
  signOut: () => void;
  isAdmin: boolean;
  isLojista: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInAdmin: async () => ({ success: false }),
  signInLojista: async () => ({ success: false }),
  signOut: () => {},
  isAdmin: false,
  isLojista: false,
});

export const useCustomAuth = () => useContext(AuthContext);

export const useCustomAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const signInAdmin = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Using standard Supabase Auth for admin too
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Login failed');
      }

      // Check if user is admin
      const { data: adminProfile, error: adminError } = await supabase
        .from('usuarios_admin')
        .select('*')
        .eq('email', data.user.email!)
        .eq('ativo', true)
        .single();

      if (adminError || !adminProfile) {
        throw new Error('Admin access denied');
      }

      // Se o login foi bem-sucedido, definir o usuário
      const adminUser: AdminUser = {
        id: data.user.id,
        nome: adminProfile.nome,
        email: data.user.email!,
        tipo: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem('auth_user', JSON.stringify(adminUser));
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInLojista = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Now using standard Supabase Auth instead of custom function
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Login failed');
      }

      // Fetch user profile to get additional info
      const { data: profile, error: profileError } = await supabase
        .from('usuarios_lojistas')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new Error('Profile not found');
      }

      // Se o login foi bem-sucedido, definir o usuário
      const lojistaUser: LojistaUser = {
        id: data.user.id,
        nome_loja: '', // Será preenchido ao selecionar loja
        nome_responsavel: profile.nome,
        email: data.user.email!,
        tipo: 'lojista'
      };
      setUser(lojistaUser);
      localStorage.setItem('auth_user', JSON.stringify(lojistaUser));
      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const isAdmin = user?.tipo === 'admin';
  const isLojista = user?.tipo === 'lojista';

  return {
    user,
    loading,
    signInAdmin,
    signInLojista,
    signOut,
    isAdmin,
    isLojista,
  };
};

export { AuthContext };