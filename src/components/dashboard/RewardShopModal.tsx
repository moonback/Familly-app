import { motion, Variants } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GiftIcon, SparklesIcon, StarIcon } from 'lucide-react';

interface Reward {
  id: string;
  label: string;
  cost: number;
}

interface RewardShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: Reward[];
  childPoints: number;
  onRewardClaim: (rewardId: string, cost: number) => void;
  childColor: string;
}

export const RewardShopModal = ({ isOpen, onClose, rewards, childPoints, onRewardClaim, childColor }: RewardShopModalProps) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
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
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl h-[90vh] max-h-[800px] bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-lg border-0 shadow-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="relative z-10 p-4 sm:p-6 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm border-b border-white/20">
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <GiftIcon className="h-8 w-8 sm:h-10 sm:w-10 text-[color:var(--child-color)] drop-shadow-xl" 
                       style={{ '--child-color': childColor } as React.CSSProperties} />
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <SparklesIcon className="w-full h-full text-yellow-400" />
              </motion.div>
            </div>
            <span className="whitespace-nowrap">Boutique de Récompenses</span>
            <div className="ml-auto flex items-center gap-2 bg-gradient-to-r from-[color:var(--child-color)]/20 to-[color:var(--child-color)]/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[color:var(--child-color)]/30"
                 style={{ '--child-color': childColor } as React.CSSProperties}>
              <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[color:var(--child-color)]" style={{ '--child-color': childColor } as React.CSSProperties} />
              <span className="font-semibold text-gray-700 text-sm sm:text-base">{childPoints} pts</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative z-10 p-4 sm:p-6 flex-1 overflow-y-auto">
          <motion.div 
            className="space-y-4 sm:space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {rewards.map((reward) => (
              <motion.div
                key={reward.id}
                variants={rewardVariants}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  transition: { type: "spring", stiffness: 400, damping: 30 }
                }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 sm:p-6 rounded-2xl border-2 cursor-pointer overflow-hidden ${
                  childPoints >= reward.cost
                    ? 'bg-gradient-to-br from-white to-white/90 border-[color:var(--child-color)]/40 hover:border-[color:var(--child-color)]/60 shadow-lg'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200 opacity-75 cursor-not-allowed'
                } transition-all duration-300`}
                style={{ '--child-color': childColor } as React.CSSProperties}
              >
                {/* Available reward glow effect */}
                {childPoints >= reward.cost && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--child-color)]/5 via-transparent to-[color:var(--child-color)]/5" 
                       style={{ '--child-color': childColor } as React.CSSProperties} />
                )}

                {/* Shimmer effect for available rewards */}
                {childPoints >= reward.cost && (
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
                )}

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        childPoints >= reward.cost 
                          ? 'bg-[color:var(--child-color)] shadow-lg' 
                          : 'bg-gray-400'
                      }`} style={{ '--child-color': childColor } as React.CSSProperties} />
                      <h4 className="text-lg sm:text-xl font-semibold text-gray-900">{reward.label}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base sm:text-lg font-medium px-3 py-1 rounded-full ${
                        childPoints >= reward.cost
                          ? 'bg-[color:var(--child-color)]/10 text-[color:var(--child-color)]'
                          : 'bg-gray-200 text-gray-500'
                      }`} style={{ '--child-color': childColor } as React.CSSProperties}>
                        {reward.cost} points
                      </span>
                      {childPoints >= reward.cost && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"
                        >
                          Disponible!
                        </motion.span>
                      )}
                    </div>
                  </div>
                  
                  <motion.div
                    whileHover={childPoints >= reward.cost ? { scale: 1.05 } : {}}
                    whileTap={childPoints >= reward.cost ? { scale: 0.95 } : {}}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      onClick={() => onRewardClaim(reward.id, reward.cost)}
                      disabled={childPoints < reward.cost}
                      className={`w-full ${
                        childPoints >= reward.cost
                          ? 'bg-gradient-to-r from-[color:var(--child-color)] to-[color:var(--child-color)]/80 hover:from-[color:var(--child-color)]/90 hover:to-[color:var(--child-color)]/70 shadow-lg hover:shadow-xl'
                          : 'bg-gray-400 cursor-not-allowed'
                      } transition-all duration-300 flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-white font-medium`}
                      style={{ '--child-color': childColor } as React.CSSProperties}
                    >
                      <GiftIcon className="h-5 w-5" />
                      {childPoints >= reward.cost ? 'Obtenir' : 'Indisponible'}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {rewards.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-8 sm:py-12"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="text-6xl sm:text-8xl mb-4 sm:mb-6"
                >
                  🎁
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">Aucune récompense disponible</h3>
                <p className="text-base sm:text-lg text-gray-500 mb-3 sm:mb-4">Demandez à vos parents d'en ajouter !</p>
                <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                  <SparklesIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Plus de récompenses bientôt...</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 