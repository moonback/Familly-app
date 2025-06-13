import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle, Clock } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50"
    >
      <Card className="w-full max-w-md mx-4 bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Protection Parent
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lockoutEndTime ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Clock className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                Accès temporairement bloqué
              </p>
              <p className="text-sm text-gray-500">
                Temps restant : {formatTime(remainingTime)}
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Entrez le code secret"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-lg tracking-widest"
                    maxLength={4}
                    autoFocus
                  />
                  {attempts > 0 && (
                    <p className="text-sm text-red-500 text-center">
                      Tentatives restantes : {MAX_ATTEMPTS - attempts}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  disabled={isLoading || code.length !== 4}
                >
                  {isLoading ? "Vérification..." : "Accéder au Dashboard"}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Pour votre sécurité, l'accès sera bloqué après {MAX_ATTEMPTS} tentatives incorrectes.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 