import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Lightbulb, Gift, Star, Target, Sparkles, Trophy, Zap, Heart, Rocket, TrendingUp, Award, Brain, CheckCircle } from 'lucide-react';

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
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Animation séquentielle des sections
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setAnimationStage(3), 1300);
    const timer4 = setTimeout(() => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }, 2000);

    // Génération des particules flottantes avec tailles variées
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      size: Math.random() * 3 + 1
    }));
    setParticles(newParticles);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const getPointsColor = (points: number) => {
    if (points >= 50) return 'text-emerald-600 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 shadow-emerald-100';
    if (points >= 30) return 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-blue-100';
    if (points >= 15) return 'text-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100';
    return 'text-gray-600 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-gray-100';
  };

  const getPointsIcon = (points: number) => {
    if (points >= 50) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-gradient-to-br from-yellow-100 to-orange-100' };
    if (points >= 30) return { icon: Star, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-100 to-cyan-100' };
    if (points >= 15) return { icon: Target, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-100 to-yellow-100' };
    return { icon: Sparkles, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-100 to-pink-100' };
  };

  const rewardIcons = [Gift, Heart, Rocket, Zap, Lightbulb, Award, Brain, CheckCircle];

  const totalPoints = analysis.task_suggestions.reduce((sum, task) => sum + task.points_reward, 0);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 via-pink-50 to-orange-50 opacity-95"></div>
        
        {/* Dynamic floating shapes with enhanced animations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-green-200/25 to-yellow-200/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-br from-cyan-200/20 to-blue-200/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>

        {/* Enhanced floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-40 animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float 8s infinite ease-in-out`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
            25% { transform: translateY(-20px) rotate(90deg) scale(1.1); }
            50% { transform: translateY(-10px) rotate(180deg) scale(0.9); }
            75% { transform: translateY(-30px) rotate(270deg) scale(1.05); }
          }
          @keyframes slideInUp {
            from { transform: translateY(40px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideInLeft {
            from { transform: translateX(-40px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(40px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeInScale {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-slide-up { animation: slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
          .animate-slide-left { animation: slideInLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
          .animate-slide-right { animation: slideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
          .animate-fade-in-scale { animation: fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
          .glass-effect {
            background: rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.18);
          }
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-lift:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }
        `
      }} />

      <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-4">
        <div className="w-full h-full min-h-[85vh] rounded-3xl shadow-2xl glass-effect overflow-hidden flex flex-col max-w-7xl">
          

          <div className="flex-1 w-full px-4 py-6 md:px-10 md:py-12 space-y-8 md:space-y-12 overflow-y-auto">
            {/* Enhanced Summary with 3D card effect */}
            <section className={`relative ${animationStage >= 1 ? 'animate-slide-up' : 'opacity-0'}`}>
              <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-purple-700 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                Résumé de l'analyse
              </h2>
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 border-2 border-purple-100 shadow-xl relative overflow-hidden hover-lift">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-200/15 to-purple-200/15 rounded-full blur-xl"></div>
                <p className="whitespace-pre-line text-gray-700 leading-relaxed text-base md:text-lg font-medium relative z-10">
                  {analysis.summary}
                </p>
              </div>
            </section>

            {/* Enhanced Animated Separator */}
            <div className="relative">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-300 via-purple-300 via-pink-300 to-orange-300 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 h-1.5 bg-gradient-to-r from-blue-400 via-purple-400 via-pink-400 to-orange-400 rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-lg">
                <Star className="w-3 h-3 text-purple-500" />
              </div>
            </div>

            {/* Enhanced Task Suggestions with improved cards */}
            {analysis.task_suggestions.length > 0 && (
              <section className={`relative ${animationStage >= 2 ? 'animate-slide-left' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-blue-700 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-lg">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  Suggestions de tâches
                  <span className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-sm font-bold rounded-full shadow-lg">
                    {analysis.task_suggestions.length} tâches
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {analysis.task_suggestions.map((task, idx) => {
                    const IconComponent = getPointsIcon(task.points_reward).icon;
                    const iconColor = getPointsIcon(task.points_reward).color;
                    const iconBg = getPointsIcon(task.points_reward).bg;
                    
                    return (
                      <div 
                        key={idx}
                        className={`group bg-white rounded-2xl p-5 md:p-6 shadow-lg border-2 border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all duration-500 transform hover-lift cursor-pointer ${
                          hoveredTask === idx ? 'ring-2 ring-blue-200 ring-opacity-50 scale-102' : ''
                        }`}
                        onMouseEnter={() => setHoveredTask(idx)}
                        onMouseLeave={() => setHoveredTask(null)}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-md border border-blue-200 group-hover:scale-105 transition-transform duration-300`}>
                              <IconComponent className={`w-6 h-6 ${iconColor}`} />
                            </div>
                            <span className="text-gray-800 font-semibold group-hover:text-blue-700 text-sm md:text-base transition-colors">
                              {task.label}
                            </span>
                          </div>
                          <div className={`px-4 py-2 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all duration-300 ${getPointsColor(task.points_reward)} ${
                            hoveredTask === idx ? 'scale-105 shadow-md' : ''
                          }`}> 
                            <Star className="w-4 h-4" />
                            {task.points_reward} pts
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Enhanced Animated Separator */}
            <div className="relative">
              <div className="h-1.5 w-full bg-gradient-to-r from-green-300 via-blue-300 via-purple-300 to-pink-300 rounded-full shadow-lg"></div>
              <div className="absolute inset-0 h-1.5 bg-gradient-to-r from-green-400 via-blue-400 via-purple-400 to-pink-400 rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-lg">
                <Gift className="w-3 h-3 text-pink-500" />
              </div>
            </div>

            {/* Enhanced Reward Suggestions with improved cards */}
            {analysis.reward_suggestions.length > 0 && (
              <section className={`relative ${animationStage >= 3 ? 'animate-slide-right' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-pink-700 mb-6">
                  <div className="p-2 bg-gradient-to-br from-pink-100 to-orange-100 rounded-xl shadow-lg">
                    <Gift className="w-6 h-6 text-pink-500" />
                  </div>
                  Idées de récompenses
                  <span className="ml-3 px-4 py-2 bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 text-sm font-bold rounded-full shadow-lg">
                    {analysis.reward_suggestions.length} idées
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {analysis.reward_suggestions.map((reward, idx) => {
                    const IconComponent = rewardIcons[idx % rewardIcons.length];
                    
                    return (
                      <div 
                        key={idx}
                        className={`group bg-gradient-to-br from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 rounded-2xl p-5 md:p-6 border-2 border-pink-100 hover:border-pink-200 shadow-lg hover:shadow-xl transition-all duration-500 transform hover-lift cursor-pointer ${
                          hoveredReward === idx ? 'ring-2 ring-pink-200 ring-opacity-50 scale-102' : ''
                        }`}
                        onMouseEnter={() => setHoveredReward(idx)}
                        onMouseLeave={() => setHoveredReward(null)}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-orange-200 rounded-xl flex items-center justify-center shadow-md border border-pink-300 group-hover:scale-105 transition-transform duration-300">
                            <IconComponent className="w-6 h-6 text-pink-600" />
                          </div>
                          <span className="text-gray-800 font-semibold group-hover:text-pink-700 text-sm md:text-base transition-colors flex-1">
                            {reward}
                          </span>
                          <div className={`transition-all duration-300 ${hoveredReward === idx ? 'scale-110 rotate-6' : ''}`}>
                            <Sparkles className="w-5 h-5 text-orange-500 group-hover:text-orange-600" />
                          </div>
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-purple-300 via-pink-300 to-orange-300 animate-pulse opacity-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
}