import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, Clock, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

interface ParentCodeProtectionProps {
  onSuccess: () => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes

export function ParentCodeProtection({ onSuccess }: ParentCodeProtectionProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est en période de verrouillage
    const storedLockoutEnd = localStorage.getItem('parentCodeLockoutEnd');
    if (storedLockoutEnd) {
      const endTime = parseInt(storedLockoutEnd);
      if (endTime > Date.now()) {
        setLockoutEndTime(endTime);
      } else {
        localStorage.removeItem('parentCodeLockoutEnd');
      }
    }
  }, []);

  useEffect(() => {
    // Mettre à jour le temps restant
    if (lockoutEndTime) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, lockoutEndTime - Date.now());
        setRemainingTime(remaining);
        if (remaining === 0) {
          setLockoutEndTime(null);
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutEndTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutEndTime) return;

    setIsLoading(true);

    try {
      // Récupérer le code parent depuis Supabase
      const { data: parentCode, error } = await supabase
        .from('parent_codes')
        .select('code')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (code === parentCode?.code) {
        // Réinitialiser les tentatives en cas de succès
        setAttempts(0);
        localStorage.removeItem('parentCodeAttempts');
        
        // Enregistrer l'accès réussi
        await supabase.from('parent_access_logs').insert({
          user_id: user?.id,
          status: 'success',
          timestamp: new Date().toISOString()
        });

        onSuccess();
      } else {
        // Incrémenter le nombre de tentatives
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('parentCodeAttempts', newAttempts.toString());

        // Enregistrer la tentative échouée
        await supabase.from('parent_access_logs').insert({
          user_id: user?.id,
          status: 'failed',
          timestamp: new Date().toISOString()
        });

        if (newAttempts >= MAX_ATTEMPTS) {
          // Activer le verrouillage
          const endTime = Date.now() + LOCKOUT_DURATION;
          setLockoutEndTime(endTime);
          localStorage.setItem('parentCodeLockoutEnd', endTime.toString());
          
          toast({
            title: "Accès bloqué",
            description: `Trop de tentatives incorrectes. Veuillez réessayer dans ${LOCKOUT_DURATION / 60000} minutes.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Code incorrect",
            description: `Il vous reste ${MAX_ATTEMPTS - newAttempts} tentative(s).`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification du code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Particules animées en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Formes géométriques modernes */}
        <motion.div
          className="absolute top-20 left-10 w-48 h-48 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Grille de fond subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Contenu principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <Card className="w-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <motion.div
                initial={{ scale: 0.5, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="flex justify-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Protection Parent
                </CardTitle>
                <p className="text-gray-400 mt-2 text-sm">
                  Accès sécurisé aux fonctionnalités parentales
                </p>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {lockoutEndTime ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="flex justify-center"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                      <Clock className="h-10 w-10 text-white" />
                    </div>
                  </motion.div>
                  
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-white">
                      Accès temporairement bloqué
                    </p>
                    <p className="text-gray-400">
                      Trop de tentatives incorrectes
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-gray-400 mb-2">Temps restant</p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {formatTime(remainingTime)}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Veuillez patienter avant de réessayer</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-purple-400 group-focus-within:text-purple-300 transition-colors" aria-hidden="true" />
                        <Input
                          type={showCode ? 'text' : 'password'}
                          placeholder="Entrez le code secret (4 chiffres)"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="pl-12 pr-12 bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 h-12 rounded-xl text-center text-lg tracking-widest"
                          maxLength={4}
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-10 w-10 hover:bg-white/10 rounded-lg transition-colors"
                          onClick={() => setShowCode(!showCode)}
                          aria-label={showCode ? 'Masquer le code' : 'Afficher le code'}
                        >
                          {showCode ? (
                            <EyeOff className="h-4 w-4 text-gray-400 hover:text-white transition-colors" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400 hover:text-white transition-colors" aria-hidden="true" />
                          )}
                        </Button>
                      </div>

                      {attempts > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Tentatives restantes : {MAX_ATTEMPTS - attempts}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] h-14 text-lg"
                      disabled={isLoading || code.length !== 4}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-3"
                          >
                            <Shield className="h-5 w-5" />
                          </motion.div>
                          Vérification...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-3 h-5 w-5" />
                          Accéder au Dashboard
                        </>
                      )}
                    </Button>
                  </form>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-6 text-center"
                  >
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm font-medium">Sécurité renforcée</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Pour votre sécurité, l'accès sera bloqué après {MAX_ATTEMPTS} tentatives incorrectes pendant 5 minutes.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 
