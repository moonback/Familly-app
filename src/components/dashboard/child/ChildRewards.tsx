import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, History, Star } from 'lucide-react';
import { useState } from 'react';

interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  child_id: string;
  created_at: string;
  is_claimed: boolean;
  claimed_at?: string;
}

interface ChildRewardsProps {
  rewards: Reward[];
  onClaimReward: (rewardId: string) => void;
  childPoints: number;
}

export function ChildRewards({ rewards, onClaimReward, childPoints }: ChildRewardsProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  const availableRewards = rewards.filter(reward => !reward.is_claimed);
  const claimedRewards = rewards.filter(reward => reward.is_claimed);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
      className="lg:col-span-2"
    >
      <Card className="p-6 h-full border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Mes Récompenses</h3>
          <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-gray-800">{childPoints} points</span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'available' ? 'default' : 'outline'}
            onClick={() => setActiveTab('available')}
            className="flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            Disponibles
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Historique
          </Button>
        </div>

        <div className="space-y-4">
          {activeTab === 'available' ? (
            availableRewards.length > 0 ? (
              availableRewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-4 shadow-md border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">{reward.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{reward.points_cost} points</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => onClaimReward(reward.id)}
                      disabled={childPoints < reward.points_cost}
                      className={`${
                        childPoints >= reward.points_cost
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                          : 'bg-gray-300 cursor-not-allowed'
                      } text-white`}
                    >
                      Obtenir
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-gray-500">Aucune récompense disponible</p>
              </motion.div>
            )
          ) : (
            claimedRewards.length > 0 ? (
              claimedRewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-white/50 rounded-xl p-4 shadow-md border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">{reward.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{reward.points_cost} points</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Obtenu le {new Date(reward.claimed_at!).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-gray-500">Aucune récompense obtenue</p>
              </motion.div>
            )
          )}
        </div>
      </Card>
    </motion.div>
  );
} 