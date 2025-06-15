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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: completedTasks, error } = await supabase
        .from('child_tasks')
        .select('completed_at, due_date')
        .eq('child_id', child.id)
        .eq('is_completed', true)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;

      let currentStreak = 0;
      let currentDate = new Date();
      const completedDates = new Set(
        completedTasks?.map(task => format(new Date(task.completed_at), 'yyyy-MM-dd')) || []
      );

      while (completedDates.has(format(currentDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error('Erreur lors du calcul du streak:', error);
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