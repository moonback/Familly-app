import { motion } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100"
    >
      <motion.div className="text-center relative">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity }
          }}
          className="rounded-full h-20 w-20 bg-gradient-to-br from-purple-600 to-pink-600 mx-auto mb-6 flex items-center justify-center shadow-2xl"
        >
          <SparklesIcon className="h-10 w-10 text-white" />
        </motion.div>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
        >
          Chargement de ton monde magique...
        </motion.p>
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-4xl mt-4"
        >
          ✨
        </motion.div>
      </motion.div>
    </motion.div>
  );
}; 