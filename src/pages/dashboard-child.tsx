import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GiftIcon, TrophyIcon, ListChecksIcon, StarIcon, SparklesIcon, CheckCircleIcon, PartyPopperIcon, BrainIcon, CalendarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar_url: string;
  custom_color: string;
  user_id: string;
}

interface Task {
  id: string;
  label: string;
  points_reward: number;
  is_daily: boolean;
}

interface ChildTask {
  id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string;
  task: Task;
}

interface Reward {
  id: string;
  label: string;
  cost: number;
}

interface Riddle {
  id: string;
  question: string;
  answer: string;
  points: number;
  is_solved: boolean;
}

export default function DashboardChild() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { childId } = useParams();
  const [child, setChild] = useState<Child | null>(null);
  const [childTasks, setChildTasks] = useState<ChildTask[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedTasksAnimation, setCompletedTasksAnimation] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredReward, setHoveredReward] = useState<string | null>(null);
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [showRiddleSuccess, setShowRiddleSuccess] = useState(false);
  const [riddleSolved, setRiddleSolved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && childId) {
      fetchChildData();
    }
  }, [user, loading, navigate, childId]);

  useEffect(() => {
    if (child?.user_id) {
      fetchDailyRiddle();
    }
  }, [child?.user_id]);

  const fetchChildData = async () => {
    try {
      // Récupérer les informations de l'enfant
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (childError) throw childError;
      setChild(childData);

      // Récupérer les tâches de l'enfant
      const { data: tasksData, error: tasksError } = await supabase
        .from('child_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('child_id', childId)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setChildTasks(tasksData);

      // Récupérer les récompenses disponibles
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', childData.user_id);

      if (rewardsError) throw rewardsError;
      setRewards(rewardsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les données",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyRiddle = async () => {
    try {
      // Vérifier d'abord si l'enfant a déjà une devinette pour aujourd'hui
      const { data: existingRiddle, error: checkError } = await supabase
        .from('daily_riddles')
        .select('*, riddles(*)')
        .eq('child_id', childId)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification de la devinette:', checkError);
        return;
      }

      if (existingRiddle) {
        // Si une devinette existe déjà pour aujourd'hui, l'utiliser
        setCurrentRiddle(existingRiddle.riddles);
        setRiddleSolved(existingRiddle.is_solved);
        return;
      }

      // Si aucune devinette n'existe pour aujourd'hui, en créer une nouvelle
      const { data: riddle, error: riddleError } = await supabase
        .from('riddles')
        .select('*')
        .eq('user_id', child?.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (riddleError) {
        console.error('Erreur lors de la récupération de la devinette:', riddleError);
        return;
      }

      if (riddle) {
        // Créer une nouvelle entrée dans daily_riddles
        const { data: dailyRiddle, error: insertError } = await supabase
          .from('daily_riddles')
          .insert([
            {
              child_id: childId,
              riddle_id: riddle.id,
              date: format(new Date(), 'yyyy-MM-dd'),
              is_solved: false
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Erreur lors de la création de la devinette quotidienne:', insertError);
          return;
        }

        setCurrentRiddle(riddle);
        setRiddleSolved(false);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la devinette:', error);
    }
  };

  const handleTaskToggle = async (childTaskId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('child_tasks')
        .update({
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
        .eq('id', childTaskId);

      if (error) throw error;

      if (!isCompleted) {
        const childTask = childTasks.find(ct => ct.id === childTaskId);
        if (childTask) {
          const { error: updateError } = await supabase
            .from('children')
            .update({
              points: (child?.points || 0) + childTask.task.points_reward
            })
            .eq('id', childId);

          if (updateError) throw updateError;
          setChild(prev => prev ? { ...prev, points: prev.points + childTask.task.points_reward } : null);
          
          // Animation améliorée
          setCompletedTasksAnimation(prev => [...prev, childTaskId]);
          setShowConfetti(true);
          setTimeout(() => {
            setCompletedTasksAnimation(prev => prev.filter(id => id !== childTaskId));
            setShowConfetti(false);
          }, 3000);

          // Toast personnalisé avec animation
          toast({
            title: '🎉 Bravo !',
            description: `Tu as gagné ${childTask.task.points_reward} points !`,
            duration: 3000,
          });
        }
      }

      fetchChildData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour la tâche",
        variant: 'destructive',
      });
    }
  };

  const handleRewardClaim = async (rewardId: string, cost: number) => {
    if (!child) return;

    try {
      if (child.points < cost) {
        toast({
          title: 'Erreur',
          description: "Points insuffisants",
          variant: 'destructive',
        });
        return;
      }

      // Créer l'enregistrement de récompense réclamée
      const { error: claimError } = await supabase
        .from('child_rewards_claimed')
        .insert([{
          child_id: childId,
          reward_id: rewardId,
          claimed_at: new Date().toISOString()
        }]);

      if (claimError) throw claimError;

      // Mettre à jour les points de l'enfant
      const { error: updateError } = await supabase
        .from('children')
        .update({
          points: child.points - cost
        })
        .eq('id', childId);

      if (updateError) throw updateError;

      toast({
        title: '🎉 Félicitations !',
        description: "Récompense réclamée avec succès",
      });

      fetchChildData();
    } catch (error) {
      console.error('Erreur lors de la réclamation de la récompense:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de réclamer la récompense",
        variant: 'destructive',
      });
    }
  };

  const handleRiddleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRiddle || !riddleAnswer.trim()) return;

    try {
      const isCorrect = riddleAnswer.toLowerCase().trim() === currentRiddle.answer.toLowerCase().trim();
      
      if (isCorrect) {
        // Mettre à jour le statut de la devinette dans daily_riddles
        const { error: updateError } = await supabase
          .from('daily_riddles')
          .update({ is_solved: true })
          .eq('child_id', childId)
          .eq('date', format(new Date(), 'yyyy-MM-dd'));

        if (updateError) {
          console.error('Erreur lors de la mise à jour de la devinette:', updateError);
          return;
        }

        // Mettre à jour les points de l'enfant
        const { error: pointsError } = await supabase
          .from('children')
          .update({
            points: (child?.points || 0) + currentRiddle.points
          })
          .eq('id', childId);

        if (pointsError) {
          console.error('Erreur lors de l\'ajout des points:', pointsError);
          return;
        }

        setRiddleSolved(true);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setRiddleAnswer('');
        fetchChildData();
      } else {
        setRiddleAnswer('');
        toast({
          title: '❌ Oups !',
          description: "Ce n'est pas la bonne réponse. Essaie encore !",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la soumission de la réponse:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[calc(100vh-80px)]"
      >
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"
          />
          <p className="text-lg font-medium text-gray-600">Chargement de ton tableau de bord...</p>
        </div>
      </motion.div>
    );
  }

  if (!user || !child) {
    return null;
  }

  const totalTasks = childTasks.length;
  const completedTasks = childTasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50"
    >
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-6xl"
              >
                🎉
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto p-6">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌟 Mon Tableau de Bord 🌟
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 font-medium"
            animate={{ 
              y: [0, -5, 0],
              opacity: [1, 0.8, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Salut {child.name} ! Prêt pour une journée incroyable ?
          </motion.p>
          <motion.div 
            className="mt-4 text-lg text-gray-700 font-medium"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CalendarIcon className="inline-block mr-2 h-5 w-5 text-purple-500" />
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profil de l'enfant - Version améliorée */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
              <div className="relative p-8 flex flex-col items-center text-center">
                <motion.div 
                  className="relative mb-6"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-4 ring-purple-300">
                    <AvatarImage src={child.avatar_url} alt={child.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                      {child.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div 
                    className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <StarIcon className="h-6 w-6 text-yellow-800" />
                  </motion.div>
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold mb-2"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {child.name}
                </motion.h2>
                <motion.p 
                  className="text-lg opacity-90 mb-6"
                  animate={{ 
                    y: [0, -5, 0],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎂 {child.age} ans
                </motion.p>
                
                <motion.div 
                  className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 w-full"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="flex items-center justify-center text-3xl font-bold mb-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <TrophyIcon className="h-8 w-8 mr-3 text-yellow-300" />
                    </motion.div>
                    <motion.span 
                      className="bg-gradient-to-r from-yellow-200 to-yellow-100 bg-clip-text text-transparent"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {child.points} Points
                    </motion.span>
                  </div>
                  <div className="flex justify-center space-x-1">
                    {[...Array(Math.min(5, Math.floor(child.points / 10)))].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          y: [0, -5, 0],
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ 
                          duration: 1,
                          delay: i * 0.1,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <StarIcon className="h-5 w-5 text-yellow-300 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Tâches du jour - Version améliorée */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ListChecksIcon className="mr-3 h-7 w-7" />
                  </motion.div>
                  🎯 Mes Missions du Jour
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-semibold text-gray-700">
                      Progression ({completedTasks}/{totalTasks})
                    </span>
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-2xl"
                    >
                      {progressPercentage === 100 ? '🎉' : progressPercentage >= 50 ? '💪' : '🚀'}
                    </motion.div>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={progressPercentage} 
                      className="w-full h-4 bg-gray-200 rounded-full overflow-hidden"
                    />
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  {progressPercentage === 100 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center mt-3"
                    >
                      <span className="text-2xl">🎊 Toutes les missions accomplies ! 🎊</span>
                    </motion.div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {childTasks.map((childTask, index) => (
                    <motion.div
                      key={childTask.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div 
                        className={`relative flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                          childTask.is_completed 
                            ? 'bg-green-50 border-green-200 shadow-md' 
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
                        } ${completedTasksAnimation.includes(childTask.id) ? 'animate-pulse bg-yellow-100' : ''}`}
                      >
                        {completedTasksAnimation.includes(childTask.id) && (
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <SparklesIcon className="h-8 w-8 text-yellow-500 animate-spin" />
                          </motion.div>
                        )}
                        
                        <motion.div 
                          className="relative"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Checkbox
                            id={`task-${childTask.id}`}
                            checked={childTask.is_completed}
                            onCheckedChange={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                            className="h-6 w-6 border-2 border-purple-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 cursor-pointer hover:scale-110 transition-transform"
                          />
                          {childTask.is_completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <CheckCircleIcon className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
                            </motion.div>
                          )}
                        </motion.div>
                        
                        <Label 
                          htmlFor={`task-${childTask.id}`} 
                          className={`flex-1 text-lg font-medium cursor-pointer transition-all duration-300 ${
                            childTask.is_completed 
                              ? 'line-through text-green-600 opacity-75' 
                              : 'text-gray-800 hover:text-purple-600'
                          }`}
                        >
                          {childTask.task.label}
                        </Label>
                        
                        <motion.div 
                          className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                            childTask.is_completed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          +{childTask.task.points_reward} points
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Récompenses disponibles - Version améliorée */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-3"
          >
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <GiftIcon className="mr-3 h-7 w-7" />
                  </motion.div>
                  🎁 Boutique de Récompenses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Card 
                        className={`relative overflow-hidden transform transition-all duration-300 ${
                          hoveredReward === reward.id ? 'scale-105' : ''
                        } ${
                          child.points >= reward.cost 
                            ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 shadow-lg' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
                        }`}
                      >
                        <motion.div 
                          className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 transform rotate-45 translate-x-8 -translate-y-8"
                          animate={{ 
                            rotate: [45, 50, 45],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative p-6 flex flex-col items-center text-center">
                          <motion.div 
                            className="text-4xl mb-4"
                            animate={{ 
                              y: [0, -5, 0],
                              scale: [1, 1.2, 1],
                              rotate: [0, 10, -10, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {child.points >= reward.cost ? '🎉' : '🔒'}
                          </motion.div>
                          <motion.h3 
                            className="text-xl font-bold mb-3 text-gray-800"
                            animate={{ 
                              scale: [1, 1.05, 1],
                              rotate: [0, 2, -2, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {reward.label}
                          </motion.h3>
                          <motion.p 
                            className="text-gray-600 mb-4"
                            animate={{ 
                              y: [0, -3, 0],
                              opacity: [1, 0.8, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            Coût: <span className="font-bold text-lg text-purple-600">{reward.cost} points</span>
                          </motion.p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              className={`w-full font-bold text-lg py-3 rounded-xl transition-all duration-300 ${
                                child.points >= reward.cost
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              disabled={child.points < reward.cost}
                              onClick={() => handleRewardClaim(reward.id, reward.cost)}
                            >
                              {child.points >= reward.cost ? '🛒 Échanger' : `💰 ${reward.cost - child.points} points manquants`}
                            </Button>
                          </motion.div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                
                {rewards.length === 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div 
                      className="text-6xl mb-4"
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎁
                    </motion.div>
                    <p className="text-xl text-gray-600">Aucune récompense disponible pour le moment</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Devinette du jour - Nouvelle section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <BrainIcon className="mr-3 h-7 w-7" />
                  </motion.div>
                  🎯 Devinette du Jour
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {currentRiddle && !riddleSolved ? (
                  <div className="space-y-6">
                    <motion.div 
                      className="text-xl font-medium text-gray-800 bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200"
                      animate={{ 
                        scale: [1, 1.02, 1],
                        rotate: [0, 1, -1, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {currentRiddle.question}
                    </motion.div>
                    <div className="flex gap-4">
                      <Input
                        type="text"
                        placeholder="Ta réponse..."
                        value={riddleAnswer}
                        onChange={(e) => setRiddleAnswer(e.target.value)}
                        className="flex-1 text-lg"
                      />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={handleRiddleSubmit}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg py-6 px-8"
                        >
                          Valider
                        </Button>
                      </motion.div>
                    </div>
                    <div className="text-center text-gray-600">
                      Points à gagner : <span className="font-bold text-yellow-600">{currentRiddle.points} points bonus</span>
                    </div>
                  </div>
                ) : currentRiddle && riddleSolved ? null : (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <motion.div 
                      className="text-6xl mb-4"
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎉
                    </motion.div>
                    <p className="text-xl text-gray-600">
                      {riddleSolved 
                        ? "Tu as déjà résolu la devinette d'aujourd'hui ! Reviens demain pour une nouvelle énigme !" 
                        : "Chargement de la devinette..."}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}