import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { BrainIcon, PlusIcon, TrashIcon, EditIcon, SparklesIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateRiddle } from '@/lib/gemini';

interface Riddle {
  id: string;
  question: string;
  answer: string;
  points: number;
  user_id: string;
  hint?: string;
}

export function RiddlesManager() {
  const { user } = useAuth();
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [difficulty, setDifficulty] = useState<'facile' | 'moyen' | 'difficile'>('moyen');
  const [newRiddle, setNewRiddle] = useState({
    question: '',
    answer: '',
    points: 50,
    hint: ''
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
        points: 50,
        hint: ''
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

  const handleGenerateRiddle = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const generatedRiddle = await generateRiddle(difficulty);
      
      if (generatedRiddle) {
        setNewRiddle({
          question: generatedRiddle.question,
          answer: generatedRiddle.answer,
          points: difficulty === 'facile' ? 30 : difficulty === 'moyen' ? 50 : 70,
          hint: generatedRiddle.hint
        });
        
        toast({
          title: 'Succès',
          description: "Devinette générée avec succès",
        });
      } else {
        throw new Error('Impossible de générer la devinette');
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la devinette:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de générer la devinette",
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full rounded-xl" />
          ))}
        </div>
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
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="difficulty">Difficulté</Label>
                <Select value={difficulty} onValueChange={(value: 'facile' | 'moyen' | 'difficile') => setDifficulty(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner la difficulté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facile">Facile (30 points)</SelectItem>
                    <SelectItem value="moyen">Moyen (50 points)</SelectItem>
                    <SelectItem value="difficile">Difficile (70 points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateRiddle}
                disabled={isGenerating}
                className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                {isGenerating ? 'Génération...' : 'Générer avec IA'}
              </Button>
            </div>
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
              <Label htmlFor="hint">Indice (optionnel)</Label>
              <Input
                id="hint"
                value={newRiddle.hint}
                onChange={(e) => setNewRiddle(prev => ({ ...prev, hint: e.target.value }))}
                placeholder="Entrez un indice pour aider l'enfant..."
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
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleCreateRiddle}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Créer la devinette
            </Button>
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
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-purple-800">
                    {riddle.question}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingRiddle(riddle)}
                      className="hover:bg-purple-100"
                    >
                      <EditIcon className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRiddle(riddle.id)}
                      className="hover:bg-red-100"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-semibold">Réponse :</span> {riddle.answer}
                  </p>
                  {riddle.hint && (
                    <p className="text-gray-500 italic">
                      <span className="font-semibold">Indice :</span> {riddle.hint}
                    </p>
                  )}
                  <p className="text-purple-600 font-semibold">
                    {riddle.points} points
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Modal d'édition */}
      {editingRiddle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white/90 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-purple-800">
                Modifier la devinette
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-question">Question</Label>
                  <Textarea
                    id="edit-question"
                    value={editingRiddle.question}
                    onChange={(e) => setEditingRiddle(prev => prev ? { ...prev, question: e.target.value } : null)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-answer">Réponse</Label>
                  <Input
                    id="edit-answer"
                    value={editingRiddle.answer}
                    onChange={(e) => setEditingRiddle(prev => prev ? { ...prev, answer: e.target.value } : null)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hint">Indice (optionnel)</Label>
                  <Input
                    id="edit-hint"
                    value={editingRiddle.hint || ''}
                    onChange={(e) => setEditingRiddle(prev => prev ? { ...prev, hint: e.target.value } : null)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-points">Points</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    value={editingRiddle.points}
                    onChange={(e) => setEditingRiddle(prev => prev ? { ...prev, points: parseInt(e.target.value) } : null)}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingRiddle(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpdateRiddle}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 