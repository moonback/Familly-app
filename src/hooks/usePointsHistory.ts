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

  return {
    pointsHistory,
    isLoading,
    refreshHistory: fetchPointsHistory
  };
}; 