import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContextType } from '@/types';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au chargement
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          // Supprimer toutes les données de session
          localStorage.clear();
          sessionStorage.clear();
        } else {
          setUser(session?.user || null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
      
      if (error) throw error;
      
      setUser(data.user);
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
      
      if (error) throw error;
      
      toast({
        title: 'Inscription réussie',
        description: 'Veuillez vérifier votre email pour confirmer votre compte.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: 'destructive',
      });
    return { error };
    }
  };

  const signOut = async () => {
    try {
      // Déconnecter l'utilisateur
      await supabase.auth.signOut();
      
      // Réinitialiser l'état
      setUser(null);
      
      // Nettoyer le stockage
      localStorage.clear();
      sessionStorage.clear();
      
      // Forcer un rechargement complet
      window.location.href = '/';
      
      return { error: null };
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer quand même la déconnexion
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
