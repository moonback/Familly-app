import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateRiddle } from '@/lib/gemini';
import { toast } from '@/hooks/use-toast';

interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar_url: string;
  custom_color: string;
  user_id: string;
  created_at: string;
}

interface Riddle {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  points: number;
  hint?: string;
  created_at: string;
}

interface DailyRiddle {
  id: string;
  child_id: string;
  riddle_id: string;
  date: string;
  is_solved: boolean;
  created_at: string;
  riddle: Riddle;
}

export function useRiddles(child: Child | null, fetchChildData: () => void) {
  const [currentRiddle, setCurrentRiddle] = useState<DailyRiddle | null>(null);
  const [riddleSolved, setRiddleSolved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hintPurchased, setHintPurchased] = useState(false);
  const [hintText, setHintText] = useState<string>('');

  useEffect(() => {
    if (child) {
      fetchCurrentRiddle();
      loadHintState();
    }
  }, [child]);

  const loadHintState = () => {
    if (!child) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(`hint_${child.id}_${today}`);
      if (stored) {
        const hintData = JSON.parse(stored);
        setHintPurchased(hintData.purchased);
        setHintText(hintData.hint || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état de l\'indice:', error);
    }
  };

  const saveHintState = (hint: string) => {
    if (!child) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const hintData = {
        purchased: true,
        hint: hint,
        date: today
      };
      localStorage.setItem(`hint_${child.id}_${today}`, JSON.stringify(hintData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état de l\'indice:', error);
    }
  };

  const fetchCurrentRiddle = async () => {
    if (!child) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Vérifier s'il y a déjà une devinette pour aujourd'hui
      const { data: dailyRiddle, error } = await supabase
        .from('daily_riddles')
        .select(`
          *,
          riddle:riddles(*)
        `)
        .eq('child_id', child.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (dailyRiddle) {
        // Une devinette existe déjà pour aujourd'hui
        setCurrentRiddle(dailyRiddle);
        setRiddleSolved(dailyRiddle.is_solved);
        console.log('Devinette existante trouvée pour aujourd\'hui:', dailyRiddle.riddle.question);
      } else {
        // Aucune devinette pour aujourd'hui, en générer une nouvelle
        console.log('Aucune devinette trouvée pour aujourd\'hui, génération d\'une nouvelle...');
        await generateNewRiddle();
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la devinette:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewRiddle = async () => {
    if (!child) return;

    try {
      // Vérifier à nouveau qu'il n'y a pas déjà une devinette pour aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { data: existingRiddle } = await supabase
        .from('daily_riddles')
        .select('*')
        .eq('child_id', child.id)
        .eq('date', today)
        .single();

      if (existingRiddle) {
        console.log('Une devinette a été créée entre-temps, utilisation de celle-ci');
        await fetchCurrentRiddle();
        return;
      }

      const difficulty = child.age < 8 ? 'facile' : child.age < 12 ? 'moyen' : 'difficile';
      const points = difficulty === 'facile' ? 30 : difficulty === 'moyen' ? 50 : 70;

      console.log('Génération d\'une nouvelle devinette...');
      
      // Générer une devinette avec l'IA
      const riddleData = await generateRiddle(difficulty);
      if (!riddleData) {
        throw new Error('Impossible de générer une devinette');
      }

      // Créer la devinette dans la table riddles
      const { data: newRiddle, error: riddleError } = await supabase
        .from('riddles')
        .insert([{
          question: riddleData.question,
          answer: riddleData.answer.toLowerCase().trim(),
          hint: riddleData.hint,
          points: points,
          user_id: child.user_id
        }])
        .select()
        .single();

      if (riddleError) throw riddleError;

      // Créer l'entrée daily_riddle pour aujourd'hui
      const { data: dailyRiddle, error: dailyError } = await supabase
        .from('daily_riddles')
        .insert([{
          child_id: child.id,
          riddle_id: newRiddle.id,
          date: today,
          is_solved: false
        }])
        .select(`
          *,
          riddle:riddles(*)
        `)
        .single();

      if (dailyError) {
        // Si l'insertion échoue, c'est peut-être qu'une devinette a été créée entre-temps
        if (dailyError.code === '23505') { // Violation de contrainte unique
          console.log('Une devinette a été créée entre-temps, récupération...');
          await fetchCurrentRiddle();
          return;
        }
        throw dailyError;
      }

      setCurrentRiddle(dailyRiddle);
      setRiddleSolved(false);
      console.log('Nouvelle devinette générée avec succès:', dailyRiddle.riddle.question);
    } catch (error) {
      console.error('Erreur lors de la génération de la devinette:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de générer une devinette pour aujourd'hui",
        variant: 'destructive',
      });
    }
  };

  const submitRiddleAnswer = async (answer: string) => {
    if (!currentRiddle || !child) return;

    // Vérifier que la devinette n'a pas déjà été résolue
    if (currentRiddle.is_solved) {
      toast({
        title: 'Déjà résolu !',
        description: "Tu as déjà résolu la devinette d'aujourd'hui !",
        variant: 'destructive',
      });
      return;
    }

    const normalizedAnswer = answer.toLowerCase().trim();
    const isCorrect = normalizedAnswer === currentRiddle.riddle.answer;

    if (isCorrect) {
      try {
        // Marquer la devinette comme résolue
        const { error: updateError } = await supabase
          .from('daily_riddles')
          .update({
            is_solved: true
          })
          .eq('id', currentRiddle.id);

        if (updateError) throw updateError;

        // Ajouter les points
        const { error: pointsError } = await supabase
          .from('children')
          .update({ points: child.points + currentRiddle.riddle.points })
          .eq('id', child.id);

        if (pointsError) throw pointsError;

        // Mettre à jour l'état local
        setCurrentRiddle(prev => prev ? { ...prev, is_solved: true } : null);
        setRiddleSolved(true);
        setShowSuccess(true);
        
        toast({
          title: '🎉 Bravo !',
          description: `Correct ! Tu as gagné ${currentRiddle.riddle.points} points !`,
        });

        fetchChildData();
        
        // Masquer le succès après 3 secondes
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Erreur lors de la validation de la réponse:', error);
        toast({
          title: 'Erreur',
          description: "Impossible de valider ta réponse",
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Essaie encore !',
        description: "Ce n'est pas la bonne réponse. Réfléchis bien !",
        variant: 'destructive',
      });
    }
  };

  const purchaseHint = async () => {
    if (!currentRiddle || !child) return;

    // Vérifier que la devinette n'a pas déjà été résolue
    if (currentRiddle.is_solved) {
      toast({
        title: 'Déjà résolu !',
        description: "Tu as déjà résolu la devinette d'aujourd'hui !",
        variant: 'destructive',
      });
      return;
    }

    // Vérifier si l'indice a déjà été acheté aujourd'hui
    if (hintPurchased) {
      toast({
        title: 'Indice déjà acheté !',
        description: "Tu as déjà acheté un indice pour aujourd'hui !",
        variant: 'destructive',
      });
      return;
    }

    if (child.points < 5) {
      toast({
        title: 'Points insuffisants',
        description: "Il te faut au moins 5 points pour acheter un indice",
        variant: 'destructive',
      });
      return;
    }

    // Vérifier si la devinette a un indice dans la base de données
    if (!currentRiddle.riddle.hint) {
      toast({
        title: 'Aucun indice disponible',
        description: "Cette devinette n'a pas d'indice disponible",
        variant: 'destructive',
      });
      return;
    }

    try {
      // Déduire les points pour l'indice
      const { error: updateError } = await supabase
        .from('children')
        .update({ points: child.points - 5 })
        .eq('id', child.id);

      if (updateError) throw updateError;

      // Utiliser l'indice de la base de données
      const hint = currentRiddle.riddle.hint;
      
      // Sauvegarder l'état de l'indice
      setHintPurchased(true);
      setHintText(hint);
      saveHintState(hint);

      toast({
        title: '💡 Indice acheté !',
        description: hint,
      });

      fetchChildData();
    } catch (error) {
      console.error('Erreur lors de l\'achat de l\'indice:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'acheter l'indice",
        variant: 'destructive',
      });
    }
  };

  return {
    currentRiddle: currentRiddle?.riddle || null,
    riddleSolved,
    showSuccess,
    loading,
    hintPurchased,
    hintText,
    submitRiddleAnswer,
    purchaseHint
  };
} 