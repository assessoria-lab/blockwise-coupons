import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  nome: string;
  nivel_permissao: string;
  tipo: 'admin';
}

interface LojistaUser {
  id: string;
  email: string;
  nome_loja: string;
  nome_responsavel: string;
  tipo: 'lojista';
}

type User = AdminUser | LojistaUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInAdmin: (email: string, password: string) => Promise<{ error: any }>;
  signInLojista: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLojista: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInAdmin: async () => ({ error: 'Not implemented' }),
  signInLojista: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  isAdmin: false,
  isLojista: false,
});

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

export const useCustomAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se há sessão ativa no localStorage
    const checkStoredSession = () => {
      try {
        const storedUser = localStorage.getItem('showpremios_user');
        const sessionExpiry = localStorage.getItem('showpremios_session_expiry');
        
        if (storedUser && sessionExpiry) {
          const expiryTime = new Date(sessionExpiry);
          if (expiryTime > new Date()) {
            setUser(JSON.parse(storedUser));
          } else {
            // Sessão expirada
            localStorage.removeItem('showpremios_user');
            localStorage.removeItem('showpremios_session_expiry');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        localStorage.removeItem('showpremios_user');
        localStorage.removeItem('showpremios_session_expiry');
      }
      setLoading(false);
    };

    checkStoredSession();
  }, []);

  const signInAdmin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('validar_login_admin', {
        p_email: email,
        p_senha: password
      });

      if (error) {
        return { error: error.message };
      }

      const result = data as any;

      if (!result.sucesso) {
        return { error: result.mensagem };
      }

      // Criar sessão admin
      const adminUser: AdminUser = {
        id: result.usuario_id,
        email: email,
        nome: result.nome,
        nivel_permissao: result.nivel_permissao,
        tipo: 'admin'
      };

      // Armazenar sessão (8 horas de duração)
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 8);
      
      localStorage.setItem('showpremios_user', JSON.stringify(adminUser));
      localStorage.setItem('showpremios_session_expiry', expiryTime.toISOString());

      setUser(adminUser);
      return { error: null };

    } catch (error) {
      return { error: 'Erro interno do servidor' };
    }
  };

  const signInLojista = async (email: string, password: string) => {
    try {
      // Use Supabase Auth for lojista login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Usuário não encontrado' };
      }

      // Buscar dados da loja do usuário logado
      const { data: lojaData, error: lojaError } = await supabase
        .from('lojistas')
        .select('id, nome_loja, nome_responsavel')
        .eq('user_id', data.user.id)
        .single();

      if (lojaError || !lojaData) {
        console.error('Erro ao buscar loja:', lojaError);
        return { error: 'Loja não encontrada para este usuário' };
      }

      // Criar sessão lojista
      const lojistaUser: LojistaUser = {
        id: data.user.id, // ID do usuário auth, não da loja
        email: email,
        nome_loja: lojaData.nome_loja,
        nome_responsavel: lojaData.nome_responsavel || '',
        tipo: 'lojista'
      };

      // Armazenar sessão (8 horas de duração)
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 8);
      
      localStorage.setItem('showpremios_user', JSON.stringify(lojistaUser));
      localStorage.setItem('showpremios_session_expiry', expiryTime.toISOString());

      setUser(lojistaUser);
      return { error: null };

    } catch (error) {
      console.error('Erro no signInLojista:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signOut = async () => {
    try {
      // Fazer logout do Supabase Auth se for lojista
      if (user?.tipo === 'lojista') {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    
    localStorage.removeItem('showpremios_user');
    localStorage.removeItem('showpremios_session_expiry');
    setUser(null);
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