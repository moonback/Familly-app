import { motion, AnimatePresence } from 'framer-motion';

interface SuccessAnimationProps {
  show: boolean;
  points: number;
}

export const SuccessAnimation = ({ show, points }: SuccessAnimationProps) => {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Animation de confettis */}
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -100, 
                  x: Math.random() * window.innerWidth,
                  opacity: 1,
                  scale: 1,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  x: Math.random() * window.innerWidth - window.innerWidth/2,
                  rotate: 360,
                  scale: [1, 1.5, 0.5],
                  opacity: [1, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut"
                }}
                className="absolute text-4xl filter drop-shadow-lg"
              >
                {['🎉', '🎊', '⭐', '🌟', '✨', '🎈', '🎁', '🏆'][Math.floor(Math.random() * 8)]}
              </motion.div>
            ))}
          </div>

          {/* Message de succès */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl border-2 border-green-200">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1 }}
                className="text-7xl mb-6 text-center"
              >
                🎉
              </motion.div>
              <h3 className="text-2xl font-bold text-center text-gray-800 mb-3">
                Bravo !
              </h3>
              <p className="text-xl text-gray-600 text-center">
                Tu as gagné {points} points !
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 