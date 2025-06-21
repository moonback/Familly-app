import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Lightbulb, Gift, Star, Target, Sparkles, Trophy, Zap, Heart, Rocket, TrendingUp, Award, Brain, CheckCircle, Clock, AlertCircle, Users, Calendar, TrendingDown, Activity, Target as TargetIcon, Award as AwardIcon, PiggyBank, ShoppingCart, Package, Brain as BrainIcon } from 'lucide-react';
import { ChildTask, Reward } from '@/types/dashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  analysis?: {
    summary: string;
    task_suggestions: Array<{ label: string; points_reward: number }>;
    reward_suggestions: string[];
  };
  childTasks?: ChildTask[];
  availableRewards?: Reward[];
  childPoints?: number;
  child?: {
    id: string;
    name: string;
    age: number;
    points: number;
    avatar_url: string;
    custom_color: string;
    user_id: string;
    created_at: string;
  };
  streak?: number;
  piggyBankStats?: {
    currentBalance: number;
    totalSavings: number;
    totalSpending: number;
    transactionCount: number;
  };
  purchaseStats?: {
    totalPurchases: number;
    totalSpent: number;
    uniqueItems: number;
    monthlyStats: Record<string, { count: number; total: number }>;
  };
}

export default function ChildAnalysis({ 
  analysis = {
    summary: "Bravo ! Tu montres d'excellents progrès dans tes apprentissages. Tes efforts en mathématiques et en lecture sont remarquables. Continue comme ça, tu es sur la bonne voie pour atteindre tous tes objectifs ! 🌟",
    task_suggestions: [],
    reward_suggestions: []
  },
  childTasks = [],
  availableRewards = [],
  childPoints = 0,
  child,
  streak = 0,
  piggyBankStats = { currentBalance: 0, totalSavings: 0, totalSpending: 0, transactionCount: 0 },
  purchaseStats = { totalPurchases: 0, totalSpent: 0, uniqueItems: 0, monthlyStats: {} }
}: Props) {
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);
  const [hoveredReward, setHoveredReward] = useState<number | null>(null);
  const [animationStage, setAnimationStage] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Filtrer les tâches en attente (non complétées)
  const pendingTasks = childTasks.filter(task => !task.is_completed);
  
  // Filtrer les récompenses disponibles (que l'enfant peut se permettre)
  const affordableRewards = availableRewards.filter(reward => childPoints >= reward.cost);

  // Calculs pour l'analyse détaillée
  const completedTasks = childTasks.filter(task => task.is_completed);
  const totalTasks = childTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  const totalPointsEarned = completedTasks.reduce((sum, task) => sum + task.task.points_reward, 0);
  const totalPointsAvailable = pendingTasks.reduce((sum, task) => sum + task.task.points_reward, 0);
  
  // Analyse par catégorie
  const categoryStats = childTasks.reduce((acc, task) => {
    const category = task.task.category;
    if (!acc[category]) {
      acc[category] = { total: 0, completed: 0, points: 0 };
    }
    acc[category].total++;
    if (task.is_completed) {
      acc[category].completed++;
      acc[category].points += task.task.points_reward;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number; points: number }>);

  // Calcul de la valeur totale
  const totalValue = childPoints + piggyBankStats.currentBalance;
  const totalValueEuros = (totalValue / 100).toFixed(2);

  // Analyse des tendances
  const getTrendAnalysis = () => {
    if (streak >= 7) return { trend: 'excellent', icon: '🚀', color: 'text-green-600', message: 'Série impressionnante !' };
    if (streak >= 3) return { trend: 'bon', icon: '📈', color: 'text-blue-600', message: 'Bonne progression !' };
    if (streak >= 1) return { trend: 'stable', icon: '✅', color: 'text-yellow-600', message: 'Continue comme ça !' };
    return { trend: 'débutant', icon: '🌱', color: 'text-gray-600', message: 'Commence ton aventure !' };
  };

  const trendAnalysis = getTrendAnalysis();

  useEffect(() => {
    // Animation séquentielle des sections
    const timer1 = setTimeout(() => setAnimationStage(1), 300);
    const timer2 = setTimeout(() => setAnimationStage(2), 800);
    const timer3 = setTimeout(() => setAnimationStage(3), 1300);
    const timer4 = setTimeout(() => setAnimationStage(4), 1800);
    const timer5 = setTimeout(() => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }, 2500);

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
      clearTimeout(timer5);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quotidien': return '🌅';
      case 'scolaire': return '📚';
      case 'maison': return '🏠';
      case 'personnel': return '🌟';
      default: return '✅';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quotidien': return 'from-blue-400 to-blue-600';
      case 'scolaire': return 'from-green-400 to-green-600';
      case 'maison': return 'from-orange-400 to-orange-600';
      case 'personnel': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const rewardIcons = [Gift, Heart, Rocket, Zap, Lightbulb, Award, Brain, CheckCircle];

  const totalPoints = pendingTasks.reduce((sum, task) => sum + task.task.points_reward, 0);

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

            {/* Nouvelle section : Analyse détaillée du profil */}
            {child && (
              <section className={`relative ${animationStage >= 2 ? 'animate-slide-left' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-indigo-700 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-indigo-500" />
                  </div>
                  Analyse détaillée du profil
                </h2>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Informations personnelles */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100 shadow-xl hover-lift">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-bold text-indigo-700">Informations personnelles</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Nom :</span>
                        <span className="font-semibold text-gray-800">{child.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Âge :</span>
                        <span className="font-semibold text-gray-800">{child.age} {child.age > 1 ? 'ans' : 'an'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Membre depuis :</span>
                        <span className="font-semibold text-gray-800">
                          {format(new Date(child.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Série actuelle :</span>
                        <span className={`font-semibold ${trendAnalysis.color}`}>
                          {trendAnalysis.icon} {streak} jour{streak > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques financières */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-100 shadow-xl hover-lift">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                        <Star className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-green-700">Statistiques financières</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Points actuels :</span>
                        <span className="font-semibold text-green-600">{childPoints} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Points épargnés :</span>
                        <span className="font-semibold text-emerald-600">{piggyBankStats.currentBalance} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Valeur totale :</span>
                        <span className="font-semibold text-green-700">{totalValueEuros} €</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total gagné :</span>
                        <span className="font-semibold text-green-600">{totalPointsEarned} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance des missions */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-100 shadow-xl hover-lift">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg">
                        <TargetIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-blue-700">Performance des missions</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Missions complétées :</span>
                        <span className="font-semibold text-blue-600">{completedTasks.length}/{totalTasks}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Taux de réussite :</span>
                        <span className="font-semibold text-blue-600">{Math.round(completionRate)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Points en attente :</span>
                        <span className="font-semibold text-blue-600">{totalPointsAvailable} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Missions restantes :</span>
                        <span className="font-semibold text-blue-600">{pendingTasks.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analyse par catégorie */}
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Performance par catégorie
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(categoryStats).map(([category, stats]) => {
                      const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                      return (
                        <div key={category} className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-lg hover-lift">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{getCategoryIcon(category)}</span>
                            <span className="font-semibold text-gray-800 capitalize">{category}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Complétées :</span>
                              <span className="font-medium">{stats.completed}/{stats.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Points gagnés :</span>
                              <span className="font-medium text-green-600">{stats.points} pts</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tendances et insights */}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-100 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-bold text-yellow-700">Analyse des tendances</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{trendAnalysis.icon}</span>
                        <span className={`font-semibold ${trendAnalysis.color}`}>{trendAnalysis.message}</span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {streak > 0 
                          ? `Tu maintiens une série de ${streak} jour${streak > 1 ? 's' : ''} consécutif${streak > 1 ? 's' : ''}. Continue comme ça !`
                          : "Commence à compléter tes missions quotidiennement pour créer une série impressionnante !"
                        }
                      </p>
                      {streak >= 3 && (
                        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                          <p className="text-yellow-800 text-sm font-medium">
                            💡 Conseil : Maintenir une série quotidienne t'aide à développer de bonnes habitudes !
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-100 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-pink-600" />
                      </div>
                      <h3 className="text-lg font-bold text-pink-700">Insights personnalisés</h3>
                    </div>
                    <div className="space-y-3">
                      {completionRate >= 80 ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Excellent taux de réussite !</span>
                        </div>
                      ) : completionRate >= 50 ? (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Target className="w-5 h-5" />
                          <span className="font-medium">Bon travail, continue tes efforts !</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">Tu peux faire mieux !</span>
                        </div>
                      )}
                      
                      {affordableRewards.length > 0 && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Gift className="w-5 h-5" />
                          <span className="font-medium">{affordableRewards.length} récompense{affordableRewards.length > 1 ? 's' : ''} disponible{affordableRewards.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      
                      {piggyBankStats.currentBalance > 0 && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <PiggyBank className="w-5 h-5" />
                          <span className="font-medium">Excellent esprit d'épargne !</span>
                        </div>
                      )}
                    </div>
                  </div>
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

            {/* Enhanced Task Suggestions with improved cards - Tâches en attente */}
            {pendingTasks.length > 0 && (
              <section className={`relative ${animationStage >= 3 ? 'animate-slide-left' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-blue-700 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  Tâches en attente
                  <span className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-sm font-bold rounded-full shadow-lg">
                    {pendingTasks.length} tâches
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingTasks.map((childTask, idx) => {
                    const IconComponent = getPointsIcon(childTask.task.points_reward).icon;
                    const iconColor = getPointsIcon(childTask.task.points_reward).color;
                    const iconBg = getPointsIcon(childTask.task.points_reward).bg;
                    
                    return (
                      <div 
                        key={childTask.id}
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
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-semibold group-hover:text-blue-700 text-sm md:text-base transition-colors">
                                {childTask.task.label}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                  {getCategoryIcon(childTask.task.category)} {childTask.task.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all duration-300 ${getPointsColor(childTask.task.points_reward)} ${
                            hoveredTask === idx ? 'scale-105 shadow-md' : ''
                          }`}> 
                            <Star className="w-4 h-4" />
                            {childTask.task.points_reward} pts
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Message si aucune tâche en attente */}
            {pendingTasks.length === 0 && (
              <section className={`relative ${animationStage >= 3 ? 'animate-slide-left' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-green-700 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-lg">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  Tâches en attente
                </h2>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 shadow-xl text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">Félicitations !</h3>
                  <p className="text-green-600">Toutes tes tâches sont complétées ! Tu peux maintenant te concentrer sur tes récompenses.</p>
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

            {/* Enhanced Reward Suggestions with improved cards - Récompenses disponibles */}
            {affordableRewards.length > 0 && (
              <section className={`relative ${animationStage >= 4 ? 'animate-slide-right' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-pink-700 mb-6">
                  <div className="p-2 bg-gradient-to-br from-pink-100 to-orange-100 rounded-xl shadow-lg">
                    <Gift className="w-6 h-6 text-pink-500" />
                  </div>
                  Récompenses disponibles
                  <span className="ml-3 px-4 py-2 bg-gradient-to-r from-pink-100 to-pink-200 text-pink-700 text-sm font-bold rounded-full shadow-lg">
                    {affordableRewards.length} récompenses
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {affordableRewards.map((reward, idx) => {
                    const IconComponent = rewardIcons[idx % rewardIcons.length];
                    
                    return (
                      <div 
                        key={reward.id}
                        className={`group bg-gradient-to-br from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 rounded-2xl p-5 md:p-6 border-2 border-pink-100 hover:border-pink-200 shadow-lg hover:shadow-xl transition-all duration-500 transform hover-lift cursor-pointer ${
                          hoveredReward === idx ? 'ring-2 ring-pink-200 ring-opacity-50 scale-102' : ''
                        }`}
                        onMouseEnter={() => setHoveredReward(idx)}
                        onMouseLeave={() => setHoveredReward(null)}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-orange-200 rounded-xl flex items-center justify-center shadow-md border border-pink-300 group-hover:scale-105 transition-transform duration-300">
                              <IconComponent className="w-6 h-6 text-pink-600" />
                            </div>
                            <span className="text-gray-800 font-semibold group-hover:text-pink-700 text-sm md:text-base transition-colors flex-1">
                              {reward.label}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`px-4 py-2 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all duration-300 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700 ${
                              hoveredReward === idx ? 'scale-105 shadow-md' : ''
                            }`}> 
                              <Star className="w-4 h-4" />
                              {reward.cost} pts
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              ✓ Disponible
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Message si aucune récompense disponible */}
            {affordableRewards.length === 0 && (
              <section className={`relative ${animationStage >= 4 ? 'animate-slide-right' : 'opacity-0'}`}>
                <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-amber-700 mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl shadow-lg">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  Récompenses disponibles
                </h2>
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-8 border-2 border-amber-100 shadow-xl text-center">
                  <div className="text-6xl mb-4">💪</div>
                  <h3 className="text-xl font-bold text-amber-700 mb-2">Continue tes efforts !</h3>
                  <p className="text-amber-600">Tu as {childPoints} points. Complète plus de tâches pour débloquer de nouvelles récompenses !</p>
                  <div className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full inline-block">
                    <span className="text-amber-700 font-bold">{childPoints} points disponibles</span>
                  </div>
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