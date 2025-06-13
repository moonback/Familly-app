import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GiftIcon } from 'lucide-react';

interface Reward {
  id: string;
  label: string;
  cost: number;
}

interface RewardShopProps {
  rewards: Reward[];
  childPoints: number;
  onRewardClaim: (rewardId: string, cost: number) => void;
  childColor: string;
}

export const RewardShop = ({ rewards, childPoints, onRewardClaim, childColor }: RewardShopProps) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.6 }}
      className="lg:col-span-3"
    >
      <Card className="shadow-2xl border-0 overflow-hidden h-full bg-white/90 backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-300 group relative z-10">
        <div
          className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)] group-hover:opacity-30 transition-opacity duration-300"
          style={{ '--child-color': childColor } as React.CSSProperties}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-10 group-hover:opacity-15 transition-opacity duration-300" />

        <CardHeader className="relative z-10 p-6 bg-white/50 backdrop-blur-sm">
          <CardTitle className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <GiftIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" style={{ '--child-color': childColor } as React.CSSProperties} />
            Mes Récompenses
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-6">
          <div className="space-y-4">
            {rewards.map((reward) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                className={`p-5 rounded-xl border-2 cursor-pointer ${
                  childPoints >= reward.cost
                    ? 'bg-white border-[color:var(--child-color)] hover:border-[color:var(--child-color)]/70'
                    : 'bg-gray-50 border-gray-200 opacity-70'
                } transition-all duration-300`}
                style={{ '--child-color': childColor } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{reward.label}</h4>
                    <p className="text-base text-gray-500">{reward.cost} points</p>
                  </div>
                  <Button
                    onClick={() => onRewardClaim(reward.id, reward.cost)}
                    disabled={childPoints < reward.cost}
                    className={`${
                      childPoints >= reward.cost
                        ? 'bg-[color:var(--child-color)] hover:opacity-80'
                        : 'bg-gray-400 cursor-not-allowed'
                    } transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-lg`}
                    style={{ '--child-color': childColor } as React.CSSProperties}
                  >
                    <GiftIcon className="h-5 w-5" />
                    Obtenir
                  </Button>
                </div>
              </motion.div>
            ))}

            {rewards.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎁</div>
                <p className="text-xl text-gray-600">Aucune récompense disponible</p>
                <p className="text-base text-gray-500 mt-2">Demandez à vos parents d'en ajouter !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 