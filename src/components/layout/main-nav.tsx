import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, UserIcon, LogOutIcon, LogInIcon, ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from 'framer-motion';

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
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-100 shadow-lg"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo et titre */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-3 group"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shadow-lg"
              >
                <SparklesIcon className="h-7 w-7 text-white" />
              </motion.div>
              <motion.span 
                className="font-black text-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                whileHover={{ scale: 1.05 }}
              >
                Family
              </motion.span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/dashboard/parent">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button 
                      variant={isActive('/dashboard/parent') ? 'default' : 'ghost'} 
                      className={`${
                        isActive('/dashboard/parent') 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                          : 'hover:bg-purple-50'
                      } transition-all duration-300`}
                    >
                      <UserIcon className="h-5 w-5 mr-2" /> 
                      Parent Dashboard
                    </Button>
                  </motion.div>
                </Link>

                {children.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Button 
                          variant="ghost" 
                          className="hover:bg-purple-50 transition-all duration-300"
                        >
                          <UserIcon className="h-5 w-5 mr-2" />
                          Enfants
                          <ChevronDownIcon className="h-4 w-4 ml-2" />
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 p-2 bg-white/95 backdrop-blur-md border-purple-100 shadow-xl">
                      {children.map((child) => (
                        <div key={child.id} className="p-1">
                          <DropdownMenuItem asChild>
                            <Link 
                              to={`/dashboard/child/${encodeURIComponent(child.name)}`}
                              className="flex items-center justify-between w-full cursor-pointer p-2 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                              <span className="flex items-center">
                                <UserIcon className="h-5 w-5 mr-3 text-purple-500" />
                                <span className="font-medium text-gray-700">{child.name}</span>
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600">
                                Dashboard
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
            {user ? (
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button 
                  variant="ghost" 
                  onClick={handleSignOut}
                  className="hover:bg-red-50 hover:text-red-500 transition-all duration-300"
                >
                  <LogOutIcon className="h-5 w-5 mr-2" />
                  <span className="hidden md:inline font-medium">Déconnexion</span>
                </Button>
              </motion.div>
            ) : (
              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Button 
                    variant="default"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                  >
                    <LogInIcon className="h-5 w-5 mr-2" />
                    <span className="hidden md:inline font-medium">Connexion</span>
                  </Button>
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
