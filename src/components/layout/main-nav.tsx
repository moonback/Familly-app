import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, UserIcon, SettingsIcon, LogOutIcon, LogInIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group transition-all duration-300 hover:scale-105"
            >
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                <HomeIcon className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Family Dashboard
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/dashboard/parent">
                  <Button 
                    variant={isActive('/dashboard/parent') ? 'secondary' : 'ghost'} 
                    className="transition-all duration-300 hover:scale-105"
                  >
                    <UserIcon className="h-4 w-4 mr-2" /> 
                    Parent Dashboard
                  </Button>
                </Link>

                {children.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="transition-all duration-300 hover:scale-105">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Enfants
                        <ChevronDownIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {children.map((child) => (
                        <div key={child.id} className="p-1">
                          <DropdownMenuItem asChild>
                            <Link 
                              to={`/dashboard/child/${child.id}`}
                              className="flex items-center justify-between w-full cursor-pointer"
                            >
                              <span className="flex items-center">
                                <UserIcon className="h-4 w-4 mr-2" />
                                {child.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Dashboard
                              </span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link 
                              to={`/child/${child.id}`}
                              className="flex items-center justify-between w-full cursor-pointer"
                            >
                              <span className="flex items-center">
                                <HomeIcon className="h-4 w-4 mr-2" />
                                {child.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Accueil
                              </span>
                            </Link>
                          </DropdownMenuItem>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {user ? (
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="transition-all duration-300 hover:scale-105 hover:text-red-500"
              >
                <LogOutIcon className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Déconnexion</span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost"
                  className="transition-all duration-300 hover:scale-105 hover:text-purple-500"
                >
                  <LogInIcon className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Connexion</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
