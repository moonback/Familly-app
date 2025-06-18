import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { seedTasks } from '@/scripts/seed-tasks';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export const TaskSeeder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const { user } = useAuth();

  const handleSeedTasks = async () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: "Vous devez être connecté pour ajouter des tâches",
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await seedTasks(user.id);
      setIsSeeded(true);
      toast({
        title: 'Succès',
        description: "Les tâches d'exemple ont été ajoutées avec succès !",
      });
    } catch (error) {
      console.error('Erreur lors du seeding:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter les tâches d'exemple",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Générateur de Tâches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-3">
            Ce bouton ajoute automatiquement 40 tâches d'exemple réparties en 4 catégories :
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">🌅 Quotidien</Badge>
              <span className="text-xs">10 tâches</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">📚 Scolaire</Badge>
              <span className="text-xs">10 tâches</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-600">🏠 Maison</Badge>
              <span className="text-xs">10 tâches</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-purple-600">🌟 Personnel</Badge>
              <span className="text-xs">10 tâches</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Note :</p>
          <p>Ces tâches seront utilisées pour générer automatiquement 15 missions quotidiennes équilibrées pour vos enfants.</p>
        </div>

        <Button
          onClick={handleSeedTasks}
          disabled={isLoading || isSeeded}
          className="w-full"
          variant={isSeeded ? "outline" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Ajout en cours...
            </>
          ) : isSeeded ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Tâches ajoutées !
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Ajouter les tâches d'exemple
            </>
          )}
        </Button>

        {isSeeded && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>Les tâches sont maintenant disponibles pour vos enfants !</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 