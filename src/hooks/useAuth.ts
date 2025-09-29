import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo_usuario?: 'admin' | 'lojista' | 'user';
  ativo?: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLojista: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // First try to find in usuarios_admin
      const { data: adminData, error: adminError } = await supabase
        .from('usuarios_admin')
        .select('*')
        .eq('user_id', userId)
        .eq('ativo', true)
        .maybeSingle();

      if (adminData) {
        return {
          id: adminData.id,
          user_id: userId,
          nome: adminData.nome,
          email: adminData.email,
          tipo_usuario: 'admin',
          ativo: adminData.ativo,
          created_at: adminData.created_at,
          updated_at: adminData.updated_at,
        } as Profile;
      }

      // If not admin, try usuarios_lojistas
      const { data: lojistaData, error: lojistaError } = await supabase
        .from('usuarios_lojistas')
        .select('*')
        .eq('id', userId)
        .eq('ativo', true)
        .maybeSingle();

      if (lojistaData) {
        return {
          id: lojistaData.id,
          user_id: userId,
          nome: lojistaData.nome,
          email: lojistaData.email,
          telefone: lojistaData.telefone,
          tipo_usuario: 'lojista',
          ativo: lojistaData.ativo,
          created_at: lojistaData.created_at,
          updated_at: lojistaData.updated_at,
        } as Profile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
      }
      
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const isAdmin = profile?.tipo_usuario === 'admin';
  const isLojista = profile?.tipo_usuario === 'lojista';

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    isAdmin,
    isLojista,
  };
};

export { AuthContext };