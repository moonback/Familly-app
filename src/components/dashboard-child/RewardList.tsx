import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { GiftIcon, TrophyIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Reward, ChildRewardClaimed, Child } from '@/types';

interface RewardListProps {
  rewards: Reward[];
  claimedRewards: ChildRewardClaimed[];
  child: Child | null;
  onClaim: (id: string, cost: number) => void;
}

export function RewardList({ rewards, claimedRewards, child, onClaim }: RewardListProps) {
  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.6 }}
        className="md:col-span-3 lg:col-span-3"
      >
        <Card className="shadow-2xl border-0 overflow-hidden h-full bg-white/90 backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-300">
          <CardHeader className="relative">
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)]" />
            <CardTitle className="relative z-10 text-3xl font-bold text-gray-800 flex items-center gap-3">
              <GiftIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" />
              Mes Récompenses
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {rewards.map(reward => (
                <motion.div
                  key={reward.id}
                  whileHover={{ scale: 1.03 }}
                  className={`p-5 rounded-xl border-2 ${
                    child?.points >= reward.cost ? 'bg-white border-purple-200 hover:border-purple-300' : 'bg-gray-50 border-gray-200'
                  } transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{reward.label}</h4>
                      <p className="text-base text-gray-500">{reward.cost} points</p>
                    </div>
                    <Button
                      onClick={() => onClaim(reward.id, reward.cost)}
                      disabled={!child || child.points < reward.cost}
                      className={`${child?.points >= reward.cost ? 'bg-[var(--child-color)] hover:opacity-80' : 'bg-gray-400'} transition-all duration-300`}
                    >
                      <GiftIcon className="h-5 w-5 mr-2" />
                      Obtenir
                    </Button>
                  </div>
                </motion.div>
              ))}

              {rewards.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎁</div>
                  <p className="text-base text-gray-600">Aucune récompense disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {claimedRewards.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.8 }}
          className="md:col-span-12 lg:col-span-12 mt-8"
        >
          <Card className="shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-300">
            <CardHeader className="relative">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)]" />
              <CardTitle className="relative z-10 text-3xl font-bold text-gray-800 flex items-center gap-3">
                <TrophyIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" />
                Mes Récompenses Obtenues
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {claimedRewards.map(claimed => (
                  <motion.div
                    key={claimed.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    className="p-6 rounded-xl border-2 bg-white border-purple-200 hover:border-purple-300 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-[color:var(--child-color)/0.12]">
                        <GiftIcon className="h-6 w-6 text-[color:var(--child-color)]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{claimed.reward.label}</h4>
                        <p className="text-base text-gray-500">
                          Obtenue le {format(new Date(claimed.claimed_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
}
