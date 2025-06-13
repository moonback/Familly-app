import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { BrainIcon, PlusIcon, TrashIcon, EditIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

interface Riddle {
  id: string;
  question: string;
  answer: string;
  points: number;
  user_id: string;
}

export function RiddlesManager() {
  const { user } = useAuth();
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRiddle, setNewRiddle] = useState({
    question: '',
    answer: '',
    points: 50
  });
  const [editingRiddle, setEditingRiddle] = useState<Riddle | null>(null);

  useEffect(() => {
    if (user) {
      fetchRiddles();
    }
  }, [user]);

  const fetchRiddles = async () => {
    try {
      const { data, error } = await supabase
        .from('riddles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiddles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des devinettes:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les devinettes",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRiddle = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('riddles')
        .insert([{
          ...newRiddle,
          user_id: user.id
        }]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: "Devinette créée avec succès",
      });

      setNewRiddle({
        question: '',
        answer: '',
        points: 50
      });
      fetchRiddles();
    } catch (error) {
      console.error('Erreur lors de la création de la devinette:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de créer la devinette",
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRiddle = async () => {
    if (!editingRiddle) return;

    try {
      const { error } = await supabase
        .from('riddles')
        .update({
          question: editingRiddle.question,
          answer: editingRiddle.answer,
          points: editingRiddle.points
        })
        .eq('id', editingRiddle.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: "Devinette mise à jour avec succès",
      });

      setEditingRiddle(null);
      fetchRiddles();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la devinette:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour la devinette",
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRiddle = async (riddleId: string) => {
    try {
      const { error } = await supabase
        .from('riddles')
        .delete()
        .eq('id', riddleId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: "Devinette supprimée avec succès",
      });

      fetchRiddles();
    } catch (error) {
      console.error('Erreur lors de la suppression de la devinette:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer la devinette",
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Formulaire de création */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-purple-800 flex items-center">
            <BrainIcon className="mr-2 h-6 w-6" />
            Créer une nouvelle devinette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={newRiddle.question}
                onChange={(e) => setNewRiddle(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Entrez la question de la devinette..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="answer">Réponse</Label>
              <Input
                id="answer"
                value={newRiddle.answer}
                onChange={(e) => setNewRiddle(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Entrez la réponse..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="points">Points à gagner</Label>
              <Input
                id="points"
                type="number"
                value={newRiddle.points}
                onChange={(e) => setNewRiddle(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                min="1"
                className="mt-1"
              />
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleCreateRiddle}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Créer la devinette
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des devinettes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {riddles.map((riddle) => (
          <motion.div
            key={riddle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-purple-800">
                  {editingRiddle?.id === riddle.id ? (
                    <Textarea
                      value={editingRiddle.question}
                      onChange={(e) => setEditingRiddle(prev => prev ? { ...prev, question: e.target.value } : null)}
                      className="mt-1"
                    />
                  ) : (
                    riddle.question
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Réponse</Label>
                    {editingRiddle?.id === riddle.id ? (
                      <Input
                        value={editingRiddle.answer}
                        onChange={(e) => setEditingRiddle(prev => prev ? { ...prev, answer: e.target.value } : null)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-600 mt-1">{riddle.answer}</p>
                    )}
                  </div>
                  <div>
                    <Label>Points</Label>
                    {editingRiddle?.id === riddle.id ? (
                      <Input
                        type="number"
                        value={editingRiddle.points}
                        onChange={(e) => setEditingRiddle(prev => prev ? { ...prev, points: parseInt(e.target.value) } : null)}
                        min="1"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-purple-600 font-bold mt-1">{riddle.points} points</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingRiddle?.id === riddle.id ? (
                      <>
                        <Button
                          onClick={handleUpdateRiddle}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        >
                          Sauvegarder
                        </Button>
                        <Button
                          onClick={() => setEditingRiddle(null)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                        >
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setEditingRiddle(riddle)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                        <Button
                          onClick={() => handleDeleteRiddle(riddle.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 