import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Child, Riddle } from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';

export const useRiddles = (child: Child | null, onPointsUpdated: () => void) => {
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [riddleSolved, setRiddleSolved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDailyRiddle = async () => {
    if (!child) return;

    try {
      const { data: existingRiddle, error: checkError } = await supabase
        .from('daily_riddles')
        .select(`
          *,
          riddles (
            id,
            question,
            answer,
            points,
            hint
          )
        `)
        .eq('child_id', child.id)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification de la devinette:', checkError);
        return;
      }

      if (existingRiddle) {
        setCurrentRiddle(existingRiddle.riddles);
        setRiddleSolved(existingRiddle.is_solved);
        return;
      }

      const { data: riddles, error: riddleError } = await supabase
        .from('riddles')
        .select(`
          id,
          question,
          answer,
          points,
          hint
        `)
        .eq('user_id', child.user_id);

      if (riddleError) {
        console.error('Erreur lors de la récupération des devinettes:', riddleError);
        return;
      }

      if (riddles && riddles.length > 0) {
        const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];

        const { data: dailyRiddle, error: insertError } = await supabase
          .from('daily_riddles')
          .insert([{
            child_id: child.id,
            riddle_id: randomRiddle.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            is_solved: false
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Erreur lors de la création de la devinette quotidienne:', insertError);
          return;
        }

        setCurrentRiddle({ ...randomRiddle, is_solved: false });
        setRiddleSolved(false);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la devinette:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRiddleAnswer = async (answer: string) => {
    if (!currentRiddle || !answer.trim() || !child) return;

    try {
      const isCorrect = answer.toLowerCase().trim() === currentRiddle.answer.toLowerCase().trim();
      
      if (isCorrect) {
        const [updateRiddleResponse, updatePointsResponse] = await Promise.all([
          supabase
            .from('daily_riddles')
            .update({ is_solved: true })
            .eq('child_id', child.id)
            .eq('date', format(new Date(), 'yyyy-MM-dd')),
          supabase
            .from('children')
            .update({
              points: (child?.points || 0) + currentRiddle.points
            })
            .eq('id', child.id)
        ]);

        if (updateRiddleResponse.error) throw updateRiddleResponse.error;
        if (updatePointsResponse.error) throw updatePointsResponse.error;

        await supabase
          .from('points_history')
          .insert([{
            user_id: child.user_id,
            child_id: child.id,
            points: currentRiddle.points,
            reason: 'Devinette résolue'
          }]);

        setRiddleSolved(true);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        toast({
          title: '🧠 Excellent !',
          description: `Tu as gagné ${currentRiddle.points} points pour avoir résolu la devinette !`,
        });
        onPointsUpdated();
      } else {
        toast({
          title: '❌ Oups !',
          description: "Ce n'est pas la bonne réponse. Essaie encore !",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission de la réponse:', error);
    }
  };

  const purchaseHint = async () => {
    if (!child || !currentRiddle) return;

    try {
      if (child.points < 10) {
        toast({
          title: "Points insuffisants",
          description: "Il te faut 10 points pour obtenir un indice",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('children')
        .update({
          points: child.points - 10
        })
        .eq('id', child.id);

      if (updateError) throw updateError;

      await supabase
        .from('points_history')
        .insert([{
          user_id: child.user_id,
          child_id: child.id,
          points: -10,
          reason: 'Achat d\'indice pour la devinette'
        }]);

      toast({
        title: "Indice acheté !",
        description: "10 points ont été déduits de ton compte",
      });
      onPointsUpdated();
    } catch (error) {
      console.error('Erreur lors de l\'achat de l\'indice:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'acheter l'indice",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (child) {
      fetchDailyRiddle();
    }
  }, [child]);

  return {
    currentRiddle,
    riddleSolved,
    showSuccess,
    isLoading,
    submitRiddleAnswer,
    purchaseHint,
    refreshRiddle: fetchDailyRiddle
  };
}; 