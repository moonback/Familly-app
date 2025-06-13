import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrophyIcon, FlameIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AvatarDisplayProps {
  child: {
    name: string;
    age: number;
    points: number;
    avatar_url: string;
    custom_color: string;
  };
  streak: number;
}

export const AvatarDisplay = ({ child, streak }: AvatarDisplayProps) => {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0, rotateY: -30 }}
      animate={{ x: 0, opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
      className="lg:col-span-3"
    >
      <div className="relative overflow-hidden border-0 shadow-2xl h-full transform hover:scale-[1.02] transition-transform duration-300 group rounded-xl">
        <div className="absolute inset-0 bg-gray-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMTUiPjxwYXRoIGQ9Ik0yMCAyMGMwIDExLjA0Ni04Ljk1NCAyMC0yMCAyMHYyMGg0MFYyMEgyMHoiLz48L2c+PC9zdmc=')] opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
        
        <div className="relative p-8 text-center text-black h-full flex flex-col justify-between">
          <div>
            <motion.div 
              className="relative mb-8"
              whileHover={{ 
                scale: 1.15,
                rotateY: 15,
                rotateX: 5
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full blur-xl opacity-50 animate-pulse group-hover:opacity-70 transition-opacity duration-300" />
              <Avatar className="relative h-32 w-32 mx-auto border-4 border-white shadow-2xl ring-4 ring-pink-300/50 group-hover:ring-pink-400/70 transition-all duration-300">
                <AvatarImage src={child.avatar_url} alt={child.name} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                  {child.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <motion.div 
                className="absolute -top-4 -right-4 text-3xl"
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👑
              </motion.div>
            </motion.div>
            
            <motion.h2 
              className="text-4xl font-black mb-3 text-white"
              animate={{ 
                textShadow: [
                  '0 0 20px rgba(255,255,255,0.5)',
                  '0 0 30px rgba(255,255,255,0.8)',
                  '0 0 20px rgba(255,255,255,0.5)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {child.name}
            </motion.h2>
            <motion.p 
              className="text-xl opacity-90 mb-4 font-semibold text-white/90"
              animate={{ 
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎂 {child.age} ans - Niveau Expert
            </motion.p>

            {streak > 0 && (
              <motion.div 
                className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/30 group-hover:border-white/50 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 30, -30, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <FlameIcon className="h-6 w-6 text-orange-300 drop-shadow-lg" />
                  </motion.div>
                  <span className="text-lg font-bold text-white">Série: {streak} jour{streak > 1 ? 's' : ''}</span>
                </div>
              </motion.div>
            )}
          </div>
          
          <motion.div 
            className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 group-hover:border-white/50 transition-colors duration-300"
            whileHover={{ 
              scale: 1.05,
              backgroundColor: 'rgba(255,255,255,0.25)'
            }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
                className="mr-4"
              >
                <TrophyIcon className="h-10 w-10 text-yellow-300 drop-shadow-lg" />
              </motion.div>
              <span className="text-base font-semibold text-yellow-100">Points Magiques</span>
            </div>
            <motion.div
              className="text-5xl font-black mb-3 text-yellow-800"
              animate={{
                scale: [1, 1.1, 1],
                textShadow: [
                  '0 0 20px rgba(255,255,0,0.5)',
                  '0 0 30px rgba(255,255,0,0.8)',
                  '0 0 20px rgba(255,255,0,0.5)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {child.points}
            </motion.div>
            <div className="text-sm text-yellow-800 font-medium">
              ~{((child?.points || 0) / 100).toFixed(2)} €
              Continue comme ça ! 🌟
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}; 