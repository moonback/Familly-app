import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

interface Reward {
  id: string;
  label: string;
  cost: number;
  user_id: string;
  created_at: string;
}

interface ClaimedReward {
  id: string;
  child_id: string;
  reward_id: string;
  claimed_at: string;
  is_validated: boolean;
  validated_at?: string;
  validated_by?: string;
  reward: Reward;
}

export function useRewards(child: Child | null, fetchChildData: () => void) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (child) {
      fetchRewards();
      fetchClaimedRewards();
    }
  }, [child]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', child?.user_id)
        .order('cost', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des récompenses:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les récompenses",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimedRewards = async () => {
    if (!child) return;
    
    try {
      const { data, error } = await supabase
        .from('claimed_rewards')
        .select(`
          *,
          reward:rewards (*)
        `)
        .eq('child_id', child.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      setClaimedRewards(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des récompenses réclamées:', error);
      setClaimedRewards([]);
    }
  };

  const claimReward = async (rewardId: string) => {
    if (!child) return;

    try {
      setClaiming(rewardId);
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) throw new Error('Récompense non trouvée');

      // Vérifier si l'enfant a assez de points
      if (child.points < reward.cost) {
        toast({
          title: 'Points insuffisants',
          description: "Tu n'as pas assez de points pour cette récompense",
          variant: 'destructive',
        });
        return;
      }

      // Créer l'entrée dans claimed_rewards
      const { error: claimError } = await supabase
        .from('claimed_rewards')
        .insert([{
          child_id: child.id,
          reward_id: rewardId,
          claimed_at: new Date().toISOString()
        }]);

      if (claimError) throw claimError;

      // Déduire les points de l'enfant
      const newWalletPoints = child.points - reward.cost;
      const { error: updateError } = await supabase
        .from('children')
        .update({ points: newWalletPoints })
        .eq('id', child.id);

      if (updateError) throw updateError;

      // Ajouter à l'historique des points
      const { error: historyError } = await supabase
        .from('points_history')
        .insert([{
          child_id: child.id,
          user_id: child.user_id,
          points: -reward.cost,
          reason: `Réclamation de récompense: ${reward.label}`,
          reward_id: rewardId,
          created_at: new Date().toISOString()
        }]);

      if (historyError) throw historyError;

      toast({
        title: '🎉 Récompense réclamée !',
        description: `Tu as réclamé "${reward.label}" ! Demande à tes parents de la valider.`,
      });

      // Mettre à jour les données
      fetchChildData();
      fetchClaimedRewards();
    } catch (error) {
      console.error('Erreur lors de la réclamation:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de réclamer la récompense",
        variant: 'destructive',
      });
    } finally {
      setClaiming(null);
    }
  };

  const isRewardClaimed = (rewardId: string) => {
    return claimedRewards.some(cr => cr.reward_id === rewardId);
  };

  const isRewardValidated = (rewardId: string) => {
    const claimedReward = claimedRewards.find(cr => cr.reward_id === rewardId);
    return claimedReward?.is_validated || false;
  };

  const getRewardStats = () => {
    const totalRewards = rewards.length;
    const claimedCount = claimedRewards.length;
    const validatedCount = claimedRewards.filter(cr => cr.is_validated).length;
    const pendingCount = claimedCount - validatedCount;

    return {
      total: totalRewards,
      claimed: claimedCount,
      validated: validatedCount,
      pending: pendingCount
    };
  };

  const getProgressToNextReward = () => {
    const unclaimedRewards = rewards.filter(r => !isRewardClaimed(r.id));
    if (unclaimedRewards.length === 0) {
      return { progress: 100, pointsNeeded: 0, nextReward: null };
    }

    const nextReward = unclaimedRewards[0];
    const progress = Math.min((child?.points || 0) / nextReward.cost * 100, 100);
    const pointsNeeded = Math.max(0, nextReward.cost - (child?.points || 0));

    return {
      progress,
      pointsNeeded,
      nextReward
    };
  };

  return {
    rewards,
    claimedRewards,
    loading,
    claiming,
    claimReward,
    isRewardClaimed,
    isRewardValidated,
    getRewardStats,
    getProgressToNextReward,
    fetchClaimedRewards
  };
} 