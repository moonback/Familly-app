import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrophyIcon, StarIcon, SparklesIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChildRewardClaimed {
  id: string;
  claimed_at: string;
  reward: {
    label: string;
    cost: number;
  };
}

interface ValidatedRewardsListProps {
  claimedRewards: ChildRewardClaimed[];
  childColor: string;
}

export function ValidatedRewardsList({ claimedRewards, childColor }: ValidatedRewardsListProps) {
  if (claimedRewards.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-[color:var(--child-color)]/20">
        <CardContent className="p-8 text-center">
          <div className="relative inline-block mb-4">
            <TrophyIcon className="w-12 h-12 text-[color:var(--child-color)]/50" style={{ '--child-color': childColor } as React.CSSProperties} />
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6"
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SparklesIcon className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
          <p className="text-lg text-muted-foreground">Aucune récompense validée pour le moment</p>
          <p className="text-sm text-muted-foreground/70 mt-2">Continue à accomplir des tâches pour gagner des récompenses !</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {claimedRewards.map((claimedReward) => (
        <motion.div
          key={claimedReward.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border-2 border-[color:var(--child-color)]/20 hover:border-[color:var(--child-color)]/40 transition-all duration-300 hover:shadow-lg"
            style={{ '--child-color': childColor } as React.CSSProperties}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <TrophyIcon className="w-8 h-8 text-[color:var(--child-color)]" style={{ '--child-color': childColor } as React.CSSProperties} />
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4"
                      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <SparklesIcon className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {claimedReward.reward.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Validé le {format(new Date(claimedReward.claimed_at), 'PPP', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-[color:var(--child-color)]/20 to-[color:var(--child-color)]/10 px-4 py-2 rounded-full border border-[color:var(--child-color)]/30"
                     style={{ '--child-color': childColor } as React.CSSProperties}>
                  <StarIcon className="w-5 h-5 text-[color:var(--child-color)]" style={{ '--child-color': childColor } as React.CSSProperties} />
                  <span className="font-semibold text-gray-700">{claimedReward.reward.cost} pts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
} 