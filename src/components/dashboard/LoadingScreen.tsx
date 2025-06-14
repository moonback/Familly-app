import { motion } from 'framer-motion';
import { Sparkles, Stars, Wand2 } from 'lucide-react';

export const LoadingScreen = () => {
  // Animation variants pour les particules flottantes
  const floatingParticles = Array.from({length: 12}, (_, i) => ({
    id: i,
    delay: i * 0.2,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 overflow-hidden"
    >
      {/* Arrière-plan animé avec des cercles */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            className={`absolute rounded-full border border-white/20 ${
              i % 2 === 0 ? 'border-purple-400/30' : 'border-pink-400/30'
            }`}
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* Particules flottantes */}
      {floatingParticles.map((particle) => (
        <motion.div
          key={particle.id}
          animate={{
            y: [-20, -40, -20],
            x: [-10, 10, -10],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: particle.delay,
          }}
          className="absolute text-yellow-300"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Contenu principal */}
      <motion.div className="text-center relative z-10">
        {/* Conteneur de l'icône principale avec effet de halo */}
        <motion.div className="relative mb-8">
          {/* Halo externe */}
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-50 scale-150"
          />
          
          {/* Icône principale */}
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative rounded-full h-24 w-24 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/50"
          >
            <motion.div
              animate={{ rotate: [0, -360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Wand2 className="h-12 w-12 text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>

          {/* Orbites avec mini icônes */}
          {[Sparkles, Stars].map((Icon, index) => (
            <motion.div
              key={index}
              animate={{ rotate: [0, 360] }}
              transition={{ 
                duration: 4 + index * 2, 
                repeat: Infinity, 
                ease: "linear",
                repeatType: index % 2 === 0 ? "loop" : "reverse"
              }}
              className="absolute inset-0 rounded-full"
              style={{
                width: `${140 + index * 20}px`,
                height: `${140 + index * 20}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <motion.div
                animate={{ 
                  scale: [0.8, 1.2, 0.8],
                  rotate: [0, -360]
                }}
                transition={{ 
                  scale: { duration: 1.5, repeat: Infinity },
                  rotate: { duration: 4 + index * 2, repeat: Infinity, ease: "linear" }
                }}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 bg-white/20 backdrop-blur-sm rounded-full p-2"
              >
                <Icon className="h-4 w-4 text-yellow-300" />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Texte principal avec effet de typing */}
        <motion.div className="mb-6">
          <motion.p 
            animate={{ 
              opacity: [0.7, 1, 0.7],
              scale: [0.98, 1.02, 0.98]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg"
          >
            Chargement de ton monde...
          </motion.p>
          
          {/* Barre de progression stylisée */}
          <motion.div className="mt-6 w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden backdrop-blur-sm">
            <motion.div
              animate={{ 
                x: ['-100%', '100%'],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                x: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 1.5, repeat: Infinity }
              }}
              className="h-full w-1/3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg"
            />
          </motion.div>
        </motion.div>

        {/* Étoiles animées en bas */}
        <motion.div className="flex justify-center space-x-4">
          {['✨', '🌟', '⭐', '💫'].map((emoji, index) => (
            <motion.div
              key={index}
              animate={{ 
                y: [-8, 8, -8],
                rotate: [0, 360],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{ 
                duration: 2 + index * 0.3, 
                repeat: Infinity,
                delay: index * 0.2
              }}
              className="text-2xl"
            >
              {emoji}
            </motion.div>
          ))}
        </motion.div>

        {/* Message secondaire */}
        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="text-purple-200/80 text-sm mt-4 font-medium"
        >
          Préparation des étoiles et des merveilles...
        </motion.p>
      </motion.div>
    </motion.div>
  );
};