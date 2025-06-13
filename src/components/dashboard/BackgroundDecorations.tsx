import { motion } from 'framer-motion';

export const BackgroundDecorations = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div 
        animate={{ 
          x: [0, 100, 0],
          y: [0, 50, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 text-7xl opacity-20 filter blur-[1px]"
      >
        ⭐
      </motion.div>
      <motion.div 
        animate={{ 
          x: [0, -80, 0],
          y: [0, 30, 0],
          rotate: [0, -180, -360],
          scale: [1, 1.3, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 text-6xl opacity-20 filter blur-[1px]"
      >
        🌟
      </motion.div>
      <motion.div 
        animate={{ 
          x: [0, 60, 0],
          y: [0, -40, 0],
          rotate: [0, 90, 180],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-32 text-5xl opacity-20 filter blur-[1px]"
      >
        ✨
      </motion.div>
      <motion.div 
        animate={{ 
          x: [0, -40, 0],
          y: [0, 60, 0],
          rotate: [0, -90, -180],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 right-16 text-6xl opacity-20 filter blur-[1px]"
      >
        🎈
      </motion.div>
    </div>
  );
}; 