import { motion, Variants } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GiftIcon, SparklesIcon, StarIcon } from 'lucide-react';
import { useState } from 'react';
import { RewardShopModal } from './RewardShopModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableRewardsCount = rewards.filter(reward => childPoints >= reward.cost).length;

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const rewardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-3 flex justify-center"
    >
      <Button
        onClick={() => setIsModalOpen(true)}
        className="relative overflow-hidden bg-gradient-to-r from-[color:var(--child-color)] to-[color:var(--child-color)]/80 hover:from-[color:var(--child-color)]/90 hover:to-[color:var(--child-color)]/70 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg group"
        style={{ '--child-color': childColor } as React.CSSProperties}
      >
        {/* Decorative background glow */}
        <motion.div
          className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 opacity-20"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${childColor}40, transparent)`
          }}
        />

        <span className="relative z-10 flex items-center gap-3">
          <GiftIcon className="h-6 w-6 relative z-10 animate-bounce group-hover:animate-none" />
          Voir les Récompenses 
          {availableRewardsCount > 0 && (
            <span className="ml-2 px-3 py-1 bg-white/30 text-white rounded-full font-semibold text-sm relative z-10 border border-white/50 animate-pulse">
              {availableRewardsCount}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full"
                animate={{ scale: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
              />
            </span>
          )}
          {availableRewardsCount === 0 && (
            <span className="ml-2 px-3 py-1 bg-white/30 text-white rounded-full font-semibold text-sm relative z-10 border border-white/50">
              Aucune
            </span>
          )}
          <motion.div
            className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <SparklesIcon className="w-full h-full" />
          </motion.div>
        </span>
      </Button>

      <RewardShopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rewards={rewards}
        childPoints={childPoints}
        onRewardClaim={onRewardClaim}
        childColor={childColor}
      />
    </motion.div>
  );
};