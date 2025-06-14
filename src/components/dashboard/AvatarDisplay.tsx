import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Flame, Star, Sparkles } from 'lucide-react';

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
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="lg:col-span-3 relative group perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div 
        className={`relative rounded-2xl p-8 transition-all duration-700 ease-in-out
        ${isHovered ? 'scale-105 rotate-y-12' : ''} 
        hover:shadow-4xl transform-gpu`}
        style={{
          backgroundImage: `linear-gradient(135deg, 
            ${child.custom_color || '#8B5CF6'} 0%, 
            ${child.custom_color ? child.custom_color + '80' : '#A855F7'} 50%, 
            ${child.custom_color ? child.custom_color + '60' : '#C084FC'} 100%)`,
          backgroundSize: isHovered ? '120% 120%' : '100% 100%',
          transition: 'all 0.7s ease'
        }}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
        
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-8 right-8 w-16 h-16 bg-white/10 rounded-full transition-all duration-1000 ${isHovered ? 'scale-125 rotate-45' : ''}`} />
          <div className={`absolute bottom-12 left-8 w-8 h-8 bg-yellow-300/20 rounded-full transition-all duration-1000 delay-150 ${isHovered ? 'scale-150 rotate-90' : ''}`} />
          <div className={`absolute top-1/2 left-4 w-4 h-4 bg-pink-300/30 rotate-45 transition-all duration-1000 delay-300 ${isHovered ? 'scale-200 rotate-180' : ''}`} />
        </div>
        
        <div className="relative p-8 text-center h-full flex flex-col justify-between">
          {/* Header section */}
          <div className="relative">
            {/* Avatar with enhanced effects */}
            <div className="relative mb-6">
              <div className={`absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 rounded-full blur-2xl opacity-40 transition-all duration-700 ${isHovered ? 'opacity-70 scale-125' : ''}`} />
              
              <div className="relative">
                <Avatar className={`h-36 w-36 mx-auto border-4 border-white/60 shadow-2xl ring-4 ring-white/30 transition-all duration-500 ${isHovered ? 'ring-8 ring-white/50 border-white/80' : ''}`}>
                  <AvatarImage src={child.avatar_url} alt={child.name} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black">
                    {child.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Floating crown with enhanced animation */}
                <div className={`absolute -top-6 -right-6 text-4xl transition-all duration-500 ${isHovered ? 'scale-125 rotate-12' : ''}`}>
                  <span className="drop-shadow-lg">👑</span>
                </div>
                
                {/* Sparkle effects */}
                {isHovered && (
                  <>
                    <Sparkles className="absolute -top-4 -left-4 h-6 w-6 text-yellow-300 animate-pulse" />
                    <Sparkles className="absolute -bottom-2 -right-2 h-4 w-4 text-pink-300 animate-pulse delay-300" />
                    <Sparkles className="absolute -bottom-4 -left-2 h-5 w-5 text-purple-300 animate-pulse delay-500" />
                  </>
                )}
              </div>
            </div>
            
            {/* Name and info */}
            <div className="space-y-4">
              <h2 className={`text-4xl font-black text-white transition-all duration-500 ${isHovered ? 'scale-110' : ''}`}
                  style={{ 
                    textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.3)' 
                  }}>
                {child.name}
              </h2>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <span className="text-white/90 font-semibold">🎂 {child.age} ans</span>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-300/30">
                  <span className="text-white/90 font-semibold">⭐ Expert</span>
                </div>
              </div>
            </div>

            {/* Streak display */}
            {streak > 0 && (
              <div className={`mt-6 bg-gradient-to-r from-orange-400/20 to-red-400/20 backdrop-blur-md rounded-2xl p-4 border border-orange-300/30 transition-all duration-500 ${isHovered ? 'scale-105 border-orange-300/50' : ''}`}>
                <div className="flex items-center justify-center gap-3">
                  <div className={`transition-all duration-300 ${isHovered ? 'animate-bounce' : ''}`}>
                    <Flame className="h-7 w-7 text-orange-300 drop-shadow-lg" />
                  </div>
                  <span className="text-xl font-bold text-white">
                    Série de feu: {streak} jour{streak > 1 ? 's' : ''} 🔥
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Points section */}
          <div className={`relative transition-all duration-500 ${isHovered ? 'scale-105' : ''}`}>
            <div className="bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/40 shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full opacity-60" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full opacity-60" />
              
              <div className="flex items-center justify-center mb-6">
                <div className={`mr-4 transition-all duration-500 ${isHovered ? 'rotate-12 scale-110' : ''}`}>
                  <Trophy className="h-12 w-12 text-yellow-300 drop-shadow-2xl" />
                </div>
                <div>
                  <span className="text-lg font-bold text-yellow-100 block">Points Magiques</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-300" />
                    <Star className="h-4 w-4 text-yellow-300" />
                    <Star className="h-4 w-4 text-yellow-300" />
                  </div>
                </div>
              </div>
              
              <div className={`text-6xl font-black mb-4 text-white transition-all duration-500 ${isHovered ? 'scale-110 animate-pulse' : ''}`}
                   style={{ 
                     filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.3))',
                     animation: isHovered ? 'glow 2s ease-in-out infinite' : 'none'
                   }}>
                {child.points.toLocaleString()}
              </div>
              <style >{`
                @keyframes glow {
                  0% { filter: drop-shadow(0 4px 8px rgba(255,255,255,0.3)); }
                  50% { filter: drop-shadow(0 4px 12px rgba(255,255,255,0.6)); }
                  100% { filter: drop-shadow(0 4px 8px rgba(255,255,255,0.3)); }
                }
              `}</style>
              
              <div className="space-y-2">
                <div className="text-lg text-yellow-200 font-semibold">
                  💰 ~{((child?.points || 0) / 100).toFixed(2)} €
                </div>
                <div className="text-sm text-white/80 font-medium">
                  Continue ton aventure magique ! ✨🌟
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000"
                     style={{ width: `${Math.min((child.points % 1000) / 10, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exemple d'utilisation
// const App = () => {
//   const sampleChild = {
//     name: "Emma",
//     age: 8,
//     points: 2847,
//     avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
//     custom_color: "#8B5CF6"
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
//       <div className="max-w-md mx-auto">
//         <AvatarDisplay child={sampleChild} streak={5} />
//       </div>
//     </div>
//   );
// };

// export default App;