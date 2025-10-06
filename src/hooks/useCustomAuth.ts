import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  nome: string;
  tipo: 'admin' | 'lojista';
  nome_loja?: string;
  nome_responsavel?: string;
  hasAdminRole?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLojista: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  isAdmin: false,
  isLojista: false,
});

export const useCustomAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

export const useCustomAuthProvider = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and check admin role
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<UserProfile | null> => {
    try {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Check if user has admin role via RPC
      const { data: hasAdminRole, error: roleError } = await supabase
        .rpc('has_role', {
          _user_id: supabaseUser.id,
          _role: 'admin'
        });

      if (roleError) {
        console.error('Error checking admin role:', roleError);
      }

      // If user is lojista, fetch store data
      let lojaData = null;
      if (profile.tipo_usuario === 'lojista') {
        const { data, error: lojaError } = await supabase
          .from('lojistas')
          .select('nome_loja, nome_responsavel')
          .eq('user_id', supabaseUser.id)
          .single();

        if (!lojaError && data) {
          lojaData = data;
        }
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        nome: profile.nome,
        tipo: profile.tipo_usuario === 'admin' ? 'admin' : 'lojista',
        nome_loja: lojaData?.nome_loja,
        nome_responsavel: lojaData?.nome_responsavel,
        hasAdminRole: hasAdminRole || false,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer profile fetching with setTimeout to prevent deadlock
          setTimeout(async () => {
            const profile = await fetchUserProfile(currentSession.user);
            setUser(profile);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user).then((profile) => {
          setUser(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user || !data.session) {
        return { error: 'Falha na autenticação' };
      }

      // Profile will be fetched by onAuthStateChange listener
      return { error: null };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { error: 'Erro interno do servidor' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAdmin = user?.hasAdminRole || false;
  const isLojista = user?.tipo === 'lojista';

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAdmin,
    isLojista,
  };
};

export { AuthContext };