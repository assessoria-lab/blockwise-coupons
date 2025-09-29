import { createContext, useContext, useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin';
}

interface LojistaUser {
  id: string;
  nome_loja: string;
  email: string;
  tipo: 'lojista';
}

type User = AdminUser | LojistaUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signInLojista: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAdmin: boolean;
  isLojista: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInAdmin: async () => {},
  signInLojista: async () => {},
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
      // Simulação de login para admin
      if (email === 'admin@sistema.com') {
        const adminUser: AdminUser = {
          id: '1',
          nome: 'Admin Sistema',
          email: email,
          tipo: 'admin'
        };
        setUser(adminUser);
        localStorage.setItem('auth_user', JSON.stringify(adminUser));
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInLojista = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulação de login para lojista
      if (email === 'loja@exemplo.com') {
        const lojistaUser: LojistaUser = {
          id: '1',
          nome_loja: 'Loja Exemplo',
          email: email,
          tipo: 'lojista'
        };
        setUser(lojistaUser);
        localStorage.setItem('auth_user', JSON.stringify(lojistaUser));
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
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