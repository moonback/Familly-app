import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Child, Reward, ChildRewardClaimed } from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';

export const useRewards = (child: Child | null, onPointsUpdated: () => void) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ChildRewardClaimed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRewards = async () => {
    if (!child) return;

    try {
      const [rewardsResponse, claimedRewardsResponse] = await Promise.all([
        supabase
          .from('rewards')
          .select('*')
          .eq('user_id', child.user_id),
        supabase
          .from('child_rewards_claimed')
          .select(`
            *,
            reward:rewards(*)
          `)
          .eq('child_id', child.id)
          .order('claimed_at', { ascending: false })
      ]);

      if (rewardsResponse.error) throw rewardsResponse.error;
      if (claimedRewardsResponse.error) throw claimedRewardsResponse.error;

      setRewards(rewardsResponse.data);
      setClaimedRewards(claimedRewardsResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des récompenses:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les récompenses",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const claimReward = async (rewardId: string, cost: number) => {
    if (!child) return;

    try {
      if (child.points < cost) {
        toast({
          title: 'Erreur',
          description: "Points insuffisants",
          variant: 'destructive',
        });
        return;
      }

      const [claimResponse, updatePointsResponse] = await Promise.all([
        supabase
          .from('child_rewards_claimed')
          .insert([{
            child_id: child.id,
            reward_id: rewardId,
            claimed_at: new Date().toISOString()
          }]),
        supabase
          .from('children')
          .update({
            points: child.points - cost
          })
          .eq('id', child.id)
      ]);

      if (claimResponse.error) throw claimResponse.error;
      if (updatePointsResponse.error) throw updatePointsResponse.error;

      const reward = rewards.find(r => r.id === rewardId);
      await supabase
        .from('points_history')
        .insert([{
          user_id: child.user_id,
          child_id: child.id,
          points: -cost,
          reason: `Récompense réclamée: ${reward?.label}`,
          reward_id: rewardId
        }]);

      toast({
        title: '🎉 Félicitations !',
        description: "Récompense réclamée avec succès",
      });

      onPointsUpdated();
      await fetchRewards();
    } catch (error) {
      console.error('Erreur lors de la réclamation de la récompense:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de réclamer la récompense",
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (child) {
      fetchRewards();
    }
  }, [child]);

  return {
    rewards,
    claimedRewards,
    isLoading,
    claimReward,
    refreshRewards: fetchRewards
  };
}; 