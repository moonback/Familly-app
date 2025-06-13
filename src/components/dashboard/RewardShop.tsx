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
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-gradient-to-r from-[color:var(--child-color)] to-[color:var(--child-color)]/80 hover:from-[color:var(--child-color)]/90 hover:to-[color:var(--child-color)]/70 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium"
        style={{ '--child-color': childColor } as React.CSSProperties}
      >
        <GiftIcon className="h-5 w-5" />
        Voir les Récompenses
      </Button>

      <RewardShopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rewards={rewards}
        childPoints={childPoints}
        onRewardClaim={onRewardClaim}
        childColor={childColor}
      />
    </>
  );
};