import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Child, PointsHistory } from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';

export const usePointsHistory = (child: Child | null) => {
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPointsHistory = async () => {
    if (!child) return;

    try {
      const { data, error } = await supabase
        .from('points_history')
        .select(`
          *,
          reward:rewards(*),
          task:tasks(*)
        `)
        .eq('child_id', child.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPointsHistory(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique des points:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger l'historique des points",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (child) {
      fetchPointsHistory();
    }
  }, [child]);

  const addPointsEntry = async (points: number, reason: string, taskId?: string, rewardId?: string) => {
    if (!child) return;

    try {
      const { error } = await supabase
        .from('points_history')
        .insert([{
          child_id: child.id,
          points,
          reason,
          task_id: taskId,
          reward_id: rewardId,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      // Rafraîchir l'historique
      fetchPointsHistory();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'entrée d\'historique:', error);
    }
  };

  return {
    pointsHistory,
    isLoading,
    addPointsEntry,
    refreshHistory: fetchPointsHistory
  };
}; 