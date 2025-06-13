import { AnimatePresence, motion } from 'framer-motion';

interface ConfettiAnimationProps {
  show: boolean;
}

export function ConfettiAnimation({ show }: ConfettiAnimationProps) {
  const pieces = Array.from({ length: 20 });
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {pieces.map((_, i) => (
            <motion.div
              key={i}
              initial={{
                y: -50,
                x: Math.random() * window.innerWidth,
                opacity: 1,
                scale: 0.8,
                rotate: 0
              }}
              animate={{
                y: window.innerHeight + 50,
                x: Math.random() * window.innerWidth - window.innerWidth / 2,
                rotate: 720,
                opacity: [1, 1, 0],
                scale: [0.8, 1, 0.5]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 4, ease: 'easeOut' }}
              className="absolute text-3xl drop-shadow-lg"
            >
              {['🎉','🎊','⭐','🌟','✨','🎈','🎁','🏆'][Math.floor(Math.random() * 8)]}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
