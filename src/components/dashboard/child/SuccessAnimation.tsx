import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface SuccessAnimationProps {
  show: boolean;
  points: number;
  onComplete: () => void;
}

export function SuccessAnimation({ show, points, onComplete }: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          setIsVisible(false);
          onComplete();
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 0,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-8xl mb-4"
            >
              🎉
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-center text-white drop-shadow-lg"
            >
              +{points} points !
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 