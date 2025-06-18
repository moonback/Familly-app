import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Child } from '@/types/dashboard';

export const useStreak = (child: Child | null) => {
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const calculateStreak = async () => {
    if (!child) return;

    try {
      // Récupérer toutes les tâches complétées de l'enfant
      const { data: completedTasks, error } = await supabase
        .from('child_tasks')
        .select('completed_at')
        .eq('child_id', child.id)
        .eq('is_completed', true)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (!completedTasks || completedTasks.length === 0) {
        setStreak(0);
        return;
      }

      // Calculer la série de jours consécutifs
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Vérifier si l'enfant a complété des tâches aujourd'hui
      const hasCompletedToday = completedTasks.some(task => {
        const taskDate = new Date(task.completed_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });

      if (!hasCompletedToday) {
        setStreak(0);
        return;
      }

      // Calculer les jours consécutifs
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1); // Commencer par hier

      while (true) {
        const hasCompletedOnDate = completedTasks.some(task => {
          const taskDate = new Date(task.completed_at);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === checkDate.getTime();
        });

        if (hasCompletedOnDate) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Ajouter 1 pour aujourd'hui
      setStreak(currentStreak + 1);
    } catch (error) {
      console.error('Erreur lors du calcul de la série:', error);
      setStreak(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (child) {
      calculateStreak();
    }
  }, [child]);

  return {
    streak,
    isLoading,
    refreshStreak: calculateStreak
  };
}; 