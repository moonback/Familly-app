import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export function SetParentCode() {
  const { user } = useAuth();
  const [oldCode, setOldCode] = useState('');
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOldCodeVerified, setIsOldCodeVerified] = useState(false);

  const verifyOldCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const { data: existingCode, error: checkError } = await supabase
        .from('parent_codes')
        .select('code')
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          // Aucun code n'existe encore, on peut passer directement à la création
          setIsOldCodeVerified(true);
          return;
        }
        throw checkError;
      }

      if (existingCode.code !== oldCode) {
        toast({
          title: "Erreur",
          description: "L'ancien code est incorrect.",
          variant: "destructive",
        });
        return;
      }

      setIsOldCodeVerified(true);
      toast({
        title: "Succès",
        description: "Ancien code vérifié. Vous pouvez maintenant définir votre nouveau code.",
      });
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification du code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      // Vérifier que les codes correspondent
      if (code !== confirmCode) {
        toast({
          title: "Erreur",
          description: "Les codes ne correspondent pas.",
          variant: "destructive",
        });
        return;
      }

      // Vérifier la longueur du code
      if (code.length !== 4) {
        toast({
          title: "Erreur",
          description: "Le code doit contenir exactement 4 chiffres.",
          variant: "destructive",
        });
        return;
      }

      // Vérifier que le code ne contient que des chiffres
      if (!/^\d+$/.test(code)) {
        toast({
          title: "Erreur",
          description: "Le code ne doit contenir que des chiffres.",
          variant: "destructive",
        });
        return;
      }

      // Vérifier si un code existe déjà
      const { data: existingCode, error: checkError } = await supabase
        .from('parent_codes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification du code:', checkError);
        throw checkError;
      }

      let error;
      if (existingCode) {
        // Mettre à jour le code existant
        const { error: updateError } = await supabase
          .from('parent_codes')
          .update({ code })
          .eq('user_id', user.id);

        error = updateError;
      } else {
        // Créer un nouveau code
        const { error: insertError } = await supabase
          .from('parent_codes')
          .insert({ user_id: user.id, code });

        error = insertError;
      }

      if (error) {
        console.error('Erreur lors de l\'enregistrement du code:', error);
        throw error;
      }

      // Enregistrer l'action dans les logs
      await supabase.from('parent_access_logs').insert({
        user_id: user.id,
        status: 'code_updated',
        timestamp: new Date().toISOString(),
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      });

      toast({
        title: "Succès",
        description: "Votre code d'accès a été mis à jour avec succès.",
      });

      // Réinitialiser les champs
      setCode('');
      setConfirmCode('');
      setOldCode('');
      setIsOldCodeVerified(false);
    } catch (error) {
      console.error('Erreur complète:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du code. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isOldCodeVerified ? "Définir le Nouveau Code" : "Vérifier l'Ancien Code"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isOldCodeVerified ? (
            <form onSubmit={verifyOldCode} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Entrez votre ancien code"
                  value={oldCode}
                  onChange={(e) => setOldCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={4}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={isLoading || oldCode.length !== 4}
              >
                {isLoading ? "Vérification..." : "Vérifier le Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Entrez votre nouveau code (4 chiffres)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={4}
                  autoFocus
                />
                <Input
                  type="password"
                  placeholder="Confirmez votre nouveau code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={4}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={isLoading || code.length !== 4 || confirmCode.length !== 4}
              >
                {isLoading ? "Enregistrement..." : "Enregistrer le Nouveau Code"}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              {isOldCodeVerified 
                ? "Choisissez un nouveau code à 4 chiffres que vous pourrez facilement mémoriser."
                : "Veuillez entrer votre code actuel pour continuer."}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 