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
  reward: Reward;
}

export function useRewards(child: Child | null, fetchChildData: () => void) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (child) {
      fetchRewards();
      loadClaimedRewards();
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

  const loadClaimedRewards = () => {
    if (!child) return;
    
    try {
      const stored = localStorage.getItem(`claimed_rewards_${child.id}`);
      if (stored) {
        const claimed = JSON.parse(stored) as string[];
        setClaimedRewards(claimed);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des récompenses réclamées:', error);
      setClaimedRewards([]);
    }
  };

  const saveClaimedRewards = (claimed: string[]) => {
    if (!child) return;
    
    try {
      localStorage.setItem(`claimed_rewards_${child.id}`, JSON.stringify(claimed));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des récompenses réclamées:', error);
    }
  };

  const claimReward = async (rewardId: string) => {
    if (!child || claiming) return;

    // Vérifier si la récompense a déjà été réclamée
    if (claimedRewards.includes(rewardId)) {
      toast({
        title: 'Déjà réclamée',
        description: "Tu as déjà réclamé cette récompense !",
        variant: 'destructive',
      });
      return;
    }

    setClaiming(rewardId);

    try {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) {
        throw new Error('Récompense non trouvée');
      }

      // Récupérer le solde de la tirelire pour le calcul total
      const { data: piggyData } = await supabase
        .from('piggy_bank_transactions')
        .select('*')
        .eq('child_id', child.id);

      const piggyStats = {
        totalSavings: piggyData?.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.points, 0) || 0,
        totalSpending: piggyData?.filter(t => t.type === 'spending').reduce((sum, t) => sum + t.points, 0) || 0,
        totalDonations: piggyData?.filter(t => t.type === 'donation').reduce((sum, t) => sum + t.points, 0) || 0
      };
      
      const piggyBalance = piggyStats.totalSavings - piggyStats.totalSpending - piggyStats.totalDonations;
      const totalAvailablePoints = child.points + piggyBalance;

      if (totalAvailablePoints < reward.cost) {
        toast({
          title: 'Points insuffisants',
          description: "Tu n'as pas assez de points pour cette récompense",
          variant: 'destructive',
        });
        return;
      }

      // Calculer combien de points utiliser de chaque source
      let pointsFromWallet = Math.min(child.points, reward.cost);
      let pointsFromPiggy = reward.cost - pointsFromWallet;

      // Mettre à jour les points de l'enfant
      const newWalletPoints = child.points - pointsFromWallet;
      const { error: updateError } = await supabase
        .from('children')
        .update({ points: newWalletPoints })
        .eq('id', child.id);

      if (updateError) throw updateError;

      // Si on utilise des points épargnés, créer une transaction de dépense
      if (pointsFromPiggy > 0) {
        const { error: piggyError } = await supabase
          .from('piggy_bank_transactions')
          .insert([{
            child_id: child.id,
            type: 'spending',
            points: pointsFromPiggy,
            created_at: new Date().toISOString()
          }]);

        if (piggyError) throw piggyError;
      }

      // Marquer comme réclamée
      const newClaimedRewards = [...claimedRewards, rewardId];
      setClaimedRewards(newClaimedRewards);
      saveClaimedRewards(newClaimedRewards);

      // Message de confirmation avec détails
      let message = `Tu as réclamé "${reward.label}" !`;
      if (pointsFromWallet > 0 && pointsFromPiggy > 0) {
        message += ` (${pointsFromWallet} points disponibles + ${pointsFromPiggy} points épargnés)`;
      } else if (pointsFromWallet > 0) {
        message += ` (${pointsFromWallet} points disponibles)`;
      } else {
        message += ` (${pointsFromPiggy} points épargnés)`;
      }

      toast({
        title: '🎉 Récompense réclamée !',
        description: message,
      });

      // Mettre à jour les données
      fetchChildData();
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
    return claimedRewards.includes(rewardId);
  };

  // Statistiques des récompenses
  const getRewardStats = () => {
    const totalRewards = rewards.length;
    const claimedCount = claimedRewards.length;
    const availableCount = totalRewards - claimedCount;
    const affordableCount = rewards.filter(r => child && child.points >= r.cost && !claimedRewards.includes(r.id)).length;
    const totalSpent = claimedRewards.reduce((total, rewardId) => {
      const reward = rewards.find(r => r.id === rewardId);
      return total + (reward?.cost || 0);
    }, 0);

    return {
      total: totalRewards,
      claimed: claimedCount,
      available: availableCount,
      affordable: affordableCount,
      totalSpent
    };
  };

  const getNextReward = () => {
    if (!child) return null;
    
    const affordableRewards = rewards.filter(r => 
      child.points >= r.cost && !claimedRewards.includes(r.id)
    );
    
    return affordableRewards.length > 0 ? affordableRewards[0] : null;
  };

  const getProgressToNextReward = () => {
    if (!child) return { progress: 0, pointsNeeded: 0, nextReward: null };
    
    const affordableRewards = rewards.filter(r => 
      child.points >= r.cost && !claimedRewards.includes(r.id)
    );
    
    if (affordableRewards.length > 0) {
      return { progress: 100, pointsNeeded: 0, nextReward: affordableRewards[0] };
    }
    
    const unclaimedRewards = rewards.filter(r => !claimedRewards.includes(r.id));
    if (unclaimedRewards.length === 0) {
      return { progress: 100, pointsNeeded: 0, nextReward: null };
    }
    
    const nextReward = unclaimedRewards.reduce((min, reward) => 
      reward.cost < min.cost ? reward : min
    );
    
    const progress = Math.min((child.points / nextReward.cost) * 100, 100);
    const pointsNeeded = Math.max(0, nextReward.cost - child.points);
    
    return { progress, pointsNeeded, nextReward };
  };

  return {
    rewards,
    claimedRewards,
    loading,
    claiming,
    claimReward,
    isRewardClaimed,
    getRewardStats,
    getNextReward,
    getProgressToNextReward
  };
} 