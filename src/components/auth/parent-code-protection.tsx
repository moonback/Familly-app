import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface ParentCodeProtectionProps {
  onSuccess: () => void;
}

export function ParentCodeProtection({ onSuccess }: ParentCodeProtectionProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Ici, vous pouvez ajouter la logique pour vérifier le code
      // Pour l'instant, nous utilisons un code fixe "1234"
      if (code === '1234') {
        onSuccess();
      } else {
        toast({
          title: "Code incorrect",
          description: "Le code que vous avez entré n'est pas correct.",
          variant: "destructive",
        });
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
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              disabled={isLoading || code.length !== 4}
            >
              {isLoading ? "Vérification..." : "Accéder au Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
} 