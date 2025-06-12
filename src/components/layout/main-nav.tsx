import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, UserIcon, SettingsIcon, LogOutIcon, LogInIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Child {
  id: string;
  name: string;
}

export function MainNav() {
  const { user, signOut } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, name')
        .eq('user_id', user?.id);

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="flex items-center justify-between p-4 border-b border-border bg-background">
      <div className="flex items-center space-x-1">
        <Link to="/" className="flex items-center space-x-2">
          <HomeIcon className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Family Dashboard</span>
        </Link>
        {user && (
          <>
            <Link to="/dashboard/parent">
              <Button variant={isActive('/dashboard/parent') ? 'secondary' : 'ghost'} className="transition-colors">
                <UserIcon className="h-4 w-4 mr-2" /> Parent Dashboard
              </Button>
            </Link>
            {children.map((child) => (
              <Link key={child.id} to={`/dashboard/child/${child.id}`}>
                <Button variant={isActive(`/dashboard/child/${child.id}`) ? 'secondary' : 'ghost'} className="transition-colors">
                  <UserIcon className="h-4 w-4 mr-2" /> {child.name}
                </Button>
              </Link>
            ))}
          </>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <ModeToggle />
        {user ? (
          <Button variant="ghost" onClick={handleSignOut} className="transition-colors">
            <LogOutIcon className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        ) : (
          <Link to="/auth">
            <Button variant="ghost" className="transition-colors">
              <LogInIcon className="h-4 w-4 mr-2" /> Connexion
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
