import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Lightbulb, Gift, Star, Target, Sparkles, Trophy, Zap, Heart, Rocket } from 'lucide-react';

interface TaskSuggestion {
  label: string;
  points_reward: number;
}

interface AnalysisResult {
  summary: string;
  task_suggestions: TaskSuggestion[];
  reward_suggestions: string[];
}

interface Props {
  analysis: AnalysisResult;
}

export default function ChildAnalysis({ analysis = {
  summary: "Bravo ! Tu montres d'excellents progrès dans tes apprentissages. Tes efforts en mathématiques et en lecture sont remarquables. Continue comme ça, tu es sur la bonne voie pour atteindre tous tes objectifs ! 🌟",
  task_suggestions: [
    { label: "Lire 15 minutes par jour", points_reward: 25 },
    { label: "Faire ses devoirs sans aide", points_reward: 40 },
    { label: "Ranger sa chambre", points_reward: 20 },
    { label: "Aider à préparer le dîner", points_reward: 35 },
    { label: "Apprendre 5 nouveaux mots", points_reward: 30 }
  ],
  reward_suggestions: [
    "Sortie au parc d'attractions",
    "Soirée cinéma en famille",
    "Nouveau livre d'aventures",
    "Kit de bricolage créatif",
    "Pique-nique dans la nature"
  ]
} }: Props) {
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);
  const [hoveredReward, setHoveredReward] = useState<number | null>(null);
  const [animationStage, setAnimationStage] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Animation séquentielle des sections
    const timer1 = setTimeout(() => setAnimationStage(1), 200);
    const timer2 = setTimeout(() => setAnimationStage(2), 600);
    const timer3 = setTimeout(() => setAnimationStage(3), 1000);

    // Génération des particules flottantes
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3
    }));
    setParticles(newParticles);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const getPointsColor = (points: number) => {
    if (points >= 50) return 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-emerald-100';
    if (points >= 30) return 'text-blue-600 bg-blue-50 border-blue-200 shadow-blue-100';
    if (points >= 15) return 'text-amber-600 bg-amber-50 border-amber-200 shadow-amber-100';
    return 'text-gray-600 bg-gray-50 border-gray-200 shadow-gray-100';
  };

  const getPointsIcon = (points: number) => {
    if (points >= 50) return { icon: Trophy, color: 'text-yellow-500' };
    if (points >= 30) return { icon: Star, color: 'text-blue-500' };
    if (points >= 15) return { icon: Target, color: 'text-amber-500' };
    return { icon: Sparkles, color: 'text-purple-500' };
  };

  const rewardIcons = [Gift, Heart, Rocket, Zap, Lightbulb];

  const totalPoints = analysis.task_suggestions.reduce((sum, task) => sum + task.points_reward, 0);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Animated background with floating particles */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-90"></div>
        
        {/* Dynamic floating shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-purple-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-blue-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-green-200/15 to-yellow-200/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animation: `float 6s infinite ease-in-out`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      <style >{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
          75% { transform: translateY(-30px) rotate(270deg); }
        }
        @keyframes slideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideInUp 0.6s ease-out; }
        .animate-slide-left { animation: slideInLeft 0.6s ease-out; }
        .animate-slide-right { animation: slideInRight 0.6s ease-out; }
      `}</style>

      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center">
        <div className="w-full h-full min-h-[80vh] rounded-none shadow-none bg-white/85 backdrop-blur-2xl border border-white/20 overflow-hidden flex flex-col">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 via-pink-600 to-orange-500 p-4 md:p-8 relative overflow-hidden w-full">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white/25 rounded-2xl backdrop-blur-sm shadow-2xl border border-white/20">
                  <BarChart3 className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-xl">
                    Analyse IA personnalisée
                  </h1>
                  <p className="text-white/90 text-xl mt-2 font-medium drop-shadow">
                    Découvre tes progrès, conseils et idées sur-mesure ! ✨
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-white font-semibold">Active</span>
                </div>
                <div className="bg-white/15 rounded-full px-4 py-2 backdrop-blur-sm border border-white/20">
                  <span className="text-white font-bold text-lg">{totalPoints} pts total</span>
                </div>
              </div>
            </div>

            {/* Floating decorative elements */}
            <Sparkles className="absolute top-6 right-1/4 w-8 h-8 text-white/40 animate-pulse" />
            <Star className="absolute bottom-6 left-1/3 w-6 h-6 text-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          <div className="flex-1 w-full px-2 py-4 md:px-8 md:py-12 space-y-8 md:space-y-12 overflow-y-auto">
            {/* Enhanced Summary */}
            <section className={`relative ${animationStage >= 1 ? 'animate-slide-up' : 'opacity-0'}`}>
              <h2 className="flex items-center gap-3 text-3xl font-bold text-purple-700 mb-6">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Sparkles className="w-7 h-7 text-purple-500" />
                </div>
                Résumé de l'analyse
              </h2>
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl"></div>
                <p className="whitespace-pre-line text-gray-700 leading-relaxed text-xl font-medium relative z-10">
                  {analysis.summary}
                </p>
              </div>
            </section>

            {/* Animated Separator */}
            <div className="relative">
              <div className="h-1 w-full bg-gradient-to-r from-blue-300 via-purple-300 via-pink-300 to-orange-300 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 via-pink-400 to-orange-400 rounded-full animate-pulse opacity-60"></div>
            </div>

            {/* Enhanced Task Suggestions */}
            {analysis.task_suggestions.length > 0 && (
              <section className={`relative ${animationStage >= 2 ? 'animate-slide-left' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-3xl font-bold text-blue-700 mb-6">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Target className="w-7 h-7 text-blue-500" />
                  </div>
                  Suggestions de tâches
                  <span className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-lg font-bold rounded-full shadow-lg">
                    {analysis.task_suggestions.length} tâches
                  </span>
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {analysis.task_suggestions.map((task, idx) => {
                    const IconComponent = getPointsIcon(task.points_reward).icon;
                    const iconColor = getPointsIcon(task.points_reward).color;
                    
                    return (
                      <div 
                        key={idx}
                        className={`group bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 hover:shadow-2xl hover:border-blue-300 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 flex items-center justify-between cursor-pointer ${
                          hoveredTask === idx ? 'ring-4 ring-blue-200 ring-opacity-50' : ''
                        }`}
                        onMouseEnter={() => setHoveredTask(idx)}
                        onMouseLeave={() => setHoveredTask(null)}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg border border-blue-200">
                            <IconComponent className={`w-8 h-8 ${iconColor}`} />
                          </div>
                          <span className="text-gray-800 font-bold group-hover:text-blue-700 text-lg transition-colors">
                            {task.label}
                          </span>
                        </div>
                        <div className={`px-5 py-3 rounded-2xl border-2 text-lg font-bold flex items-center gap-2 transition-all duration-300 ${getPointsColor(task.points_reward)} ${
                          hoveredTask === idx ? 'scale-110 shadow-lg' : ''
                        }`}> 
                          <Star className="w-5 h-5" />
                          {task.points_reward} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Animated Separator */}
            <div className="relative">
              <div className="h-1 w-full bg-gradient-to-r from-green-300 via-blue-300 via-purple-300 to-pink-300 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 h-1 bg-gradient-to-r from-green-400 via-blue-400 via-purple-400 to-pink-400 rounded-full animate-pulse opacity-60"></div>
            </div>

            {/* Enhanced Reward Suggestions */}
            {analysis.reward_suggestions.length > 0 && (
              <section className={`relative ${animationStage >= 3 ? 'animate-slide-right' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-3xl font-bold text-pink-700 mb-6">
                  <div className="p-2 bg-pink-100 rounded-xl">
                    <Gift className="w-7 h-7 text-pink-500" />
                  </div>
                  Idées de récompenses
                  <span className="ml-3 px-4 py-2 bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 text-lg font-bold rounded-full shadow-lg">
                    {analysis.reward_suggestions.length} idées
                  </span>
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {analysis.reward_suggestions.map((reward, idx) => {
                    const IconComponent = rewardIcons[idx % rewardIcons.length];
                    
                    return (
                      <div 
                        key={idx}
                        className={`group bg-gradient-to-br from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 rounded-3xl p-6 border-2 border-pink-100 hover:border-pink-200 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 flex items-center gap-5 cursor-pointer ${
                          hoveredReward === idx ? 'ring-4 ring-pink-200 ring-opacity-50' : ''
                        }`}
                        onMouseEnter={() => setHoveredReward(idx)}
                        onMouseLeave={() => setHoveredReward(null)}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-200 to-orange-200 rounded-2xl flex items-center justify-center shadow-lg border border-pink-300">
                          <IconComponent className="w-8 h-8 text-pink-600" />
                        </div>
                        <span className="text-gray-800 font-bold group-hover:text-pink-700 text-lg transition-colors flex-1">
                          {reward}
                        </span>
                        <div className={`transition-all duration-300 ${hoveredReward === idx ? 'scale-125 rotate-12' : ''}`}>
                          <Sparkles className="w-6 h-6 text-orange-500 group-hover:text-orange-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Enhanced Bottom gradient border */}
          <div className="relative h-3 w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-orange-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 via-pink-400 to-orange-400 animate-pulse opacity-70"></div>
          </div>
        </div>
      </div>
    </div>
  );
}