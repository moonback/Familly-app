import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GiftIcon, TrophyIcon, ListChecksIcon, StarIcon, CheckCircleIcon, PartyPopperIcon, BrainIcon, CalendarIcon, FlameIcon, SparklesIcon, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ShopItemsList } from '@/components/shop/shop-items-list';
import { PiggyBankManager } from '@/components/piggy-bank/piggy-bank-manager';

import { Header } from "@/components/dashboard-child/Header";
import { TaskList } from "@/components/dashboard-child/TaskList";
import { RewardList } from "@/components/dashboard-child/RewardList";
import { PenaltyList } from "@/components/dashboard-child/PenaltyList";
import { DailyRiddle } from "@/components/dashboard-child/DailyRiddle";
import { ConfettiAnimation } from "@/components/dashboard-child/ConfettiAnimation";
interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar_url: string;
  custom_color: string;
  user_id: string;
  created_at: string;
}

interface Task {
  id: string;
  label: string;
  points_reward: number;
  is_daily: boolean;
  age_min: number;
  age_max: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
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

interface ChildRewardClaimed {
  id: string;
  child_id: string;
  reward_id: string;
  claimed_at: string;
  reward: Reward;
}

interface PenaltyHistory {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

const generateAgeAppropriateTasks = async (child: Child) => {
  try {
    // Vérifier si des tâches existent déjà pour aujourd'hui
    const { data: existingTasks, error: checkError } = await supabase
      .from('child_tasks')
      .select('*')
      .eq('child_id', child.id)
      .eq('due_date', format(new Date(), 'yyyy-MM-dd'));

    if (checkError) {
      console.error('Erreur lors de la vérification des tâches existantes:', checkError);
      return;
    }

    // Si aucune tâche n'existe pour aujourd'hui, en créer de nouvelles
    if (!existingTasks || existingTasks.length === 0) {
      // Récupérer toutes les tâches appropriées à l'âge de l'enfant
      const { data: ageAppropriateTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', child.user_id)
        .lte('age_min', child.age)
        .gte('age_max', child.age);

      if (tasksError) {
        console.error('Erreur lors de la récupération des tâches:', tasksError);
        return;
      }

      if (ageAppropriateTasks && ageAppropriateTasks.length > 0) {
        // Sélectionner 5 tâches aléatoires parmi les tâches appropriées
        const selectedTasks = ageAppropriateTasks
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);

        // Créer les tâches dans la base de données
        for (const task of selectedTasks) {
          const { error: insertError } = await supabase
            .from('child_tasks')
            .insert([
              {
                child_id: child.id,
                task_id: task.id,
                due_date: format(new Date(), 'yyyy-MM-dd'),
                is_completed: false
              }
            ]);

          if (insertError) {
            console.error('Erreur lors de la création de la tâche:', insertError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la génération des tâches:', error);
  }
};

export default function DashboardChild() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { childName } = useParams();
  const [child, setChild] = useState<Child | null>(null);
  const [childTasks, setChildTasks] = useState<ChildTask[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedTasksAnimation, setCompletedTasksAnimation] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [showRiddleSuccess, setShowRiddleSuccess] = useState(false);
  const [riddleSolved, setRiddleSolved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState<ChildRewardClaimed[]>([]);
  const [streak, setStreak] = useState(0);
  const [penalties, setPenalties] = useState<PenaltyHistory[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && childName) {
      fetchChildData();
    }
  }, [user, loading, navigate, childName]);

  useEffect(() => {
    if (child?.user_id) {
      fetchDailyRiddle();
      calculateStreak();
    }
  }, [child?.user_id]);

  const calculateStreak = async () => {
    if (!childName) return;

    try {
      // Récupérer les tâches complétées des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: completedTasks, error } = await supabase
        .from('child_tasks')
        .select('completed_at, due_date')
        .eq('child_id', child?.id)
        .eq('is_completed', true)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Calculer le streak
      let currentStreak = 0;
      let currentDate = new Date();
      const completedDates = new Set(
        completedTasks?.map(task => format(new Date(task.completed_at), 'yyyy-MM-dd')) || []
      );

      // Vérifier les jours consécutifs en remontant dans le temps
      while (completedDates.has(format(currentDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      setStreak(currentStreak);
    } catch (error) {
      console.error('Erreur lors du calcul du streak:', error);
    }
  };

  const fetchChildData = async () => {
    try {
      // Récupérer les informations de l'enfant
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('name', childName)
        .single();

      if (childError) throw childError;
      setChild(childData);

      // Générer des tâches appropriées à l'âge de l'enfant
      await generateAgeAppropriateTasks(childData);

      // Récupérer les tâches de l'enfant
      const { data: tasksData, error: tasksError } = await supabase
        .from('child_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('child_id', childData.id)
        .eq('due_date', format(new Date(), 'yyyy-MM-dd'))
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

      // Récupérer les récompenses réclamées
      const { data: claimedRewardsData, error: claimedRewardsError } = await supabase
        .from('child_rewards_claimed')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('child_id', childData.id)
        .order('claimed_at', { ascending: false });

      if (claimedRewardsError) throw claimedRewardsError;
      setClaimedRewards(claimedRewardsData);

      // Récupérer l'historique des pénalités
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from('points_history')
        .select('*')
        .eq('child_id', childData.id)
        .lt('points', 0)
        .order('created_at', { ascending: false });

      if (penaltiesError) throw penaltiesError;
      setPenalties(penaltiesData || []);
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
        .eq('child_id', child?.id)
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
      const { data: riddles, error: riddleError } = await supabase
        .from('riddles')
        .select('*')
        .eq('user_id', child?.user_id);

      if (riddleError) {
        console.error('Erreur lors de la récupération des devinettes:', riddleError);
        return;
      }

      if (riddles && riddles.length > 0) {
        // Sélectionner une devinette aléatoire
        const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];

        // Créer une nouvelle entrée dans daily_riddles
        const { data: dailyRiddle, error: insertError } = await supabase
          .from('daily_riddles')
          .insert([
            {
              child_id: child?.id,
              riddle_id: randomRiddle.id,
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

        setCurrentRiddle(randomRiddle);
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
          // Mettre à jour les points de l'enfant
          const { error: updateError } = await supabase
            .from('children')
            .update({
              points: (child?.points || 0) + childTask.task.points_reward
            })
            .eq('id', child?.id);

          if (updateError) throw updateError;

          // Enregistrer dans l'historique des points
          const { error: historyError } = await supabase
            .from('points_history')
            .insert([{
              user_id: child?.user_id,
              child_id: child?.id,
              points: childTask.task.points_reward,
              reason: `Tâche complétée: ${childTask.task.label}`
            }]);

          if (historyError) console.error('Erreur historique:', historyError);

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

          // Recalculer le streak
          calculateStreak();
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
          child_id: child.id,
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
        .eq('id', child.id);

      if (updateError) throw updateError;

      // Enregistrer dans l'historique des points
      const reward = rewards.find(r => r.id === rewardId);
      const { error: historyError } = await supabase
        .from('points_history')
        .insert([{
          user_id: child.user_id,
          child_id: child.id,
          points: -cost,
          reason: `Récompense réclamée: ${reward?.label}`
        }]);

      if (historyError) console.error('Erreur historique:', historyError);

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
    if (!currentRiddle || !riddleAnswer.trim() || !child) return;

    try {
      const isCorrect = riddleAnswer.toLowerCase().trim() === currentRiddle.answer.toLowerCase().trim();
      
      if (isCorrect) {
        // Mettre à jour le statut de la devinette dans daily_riddles
        const { error: updateError } = await supabase
          .from('daily_riddles')
          .update({ is_solved: true })
          .eq('child_id', child.id)
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
          .eq('id', child.id);

        if (pointsError) {
          console.error('Erreur lors de l\'ajout des points:', pointsError);
          return;
        }

        // Enregistrer dans l'historique des points
        const { error: historyError } = await supabase
          .from('points_history')
          .insert([{
            user_id: child.user_id,
            child_id: child.id,
            points: currentRiddle.points,
            reason: 'Devinette résolue'
          }]);

        if (historyError) console.error('Erreur historique:', historyError);

        setRiddleSolved(true);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setRiddleAnswer('');
        fetchChildData();

        toast({
          title: '🧠 Excellent !',
          description: `Tu as gagné ${currentRiddle.points} points pour avoir résolu la devinette !`,
        });
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
      style={{
        '--child-color': child?.custom_color || '#8B5CF6',
      } as React.CSSProperties}
      className={`min-h-screen relative overflow-hidden ${
        child?.custom_color
          ? 'bg-[linear-gradient(135deg,var(--child-color)_20,var(--child-color)_10,#f8fafc)]'
          : 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100'
      }`}
    >
      {/* Éléments décoratifs de fond améliorés */}
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

        <ConfettiAnimation show={showConfetti} />

      <motion.div className="relative z-10 p-6">        {/* En-tête avec titre amélioré */}
          <Header child={child} />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 max-w-7xl mx-auto">
          {/* Profil de l'enfant amélioré */}
          <motion.div
            initial={{ x: -100, opacity: 0, rotateY: -30 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.2 
            }}
            className="md:col-span-3 lg:col-span-3"
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl h-full transform hover:scale-[1.02] transition-transform duration-300">
              <div
                className="absolute inset-0 bg-[linear-gradient(135deg,var(--child-color),var(--child-color)dd)]"
              />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-30" />
              
              <div className="relative p-8 text-center text-white h-full flex flex-col justify-between">
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
                    <div className="absolute -inset-6 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
                    <Avatar className="relative h-32 w-32 mx-auto border-4 border-white shadow-2xl ring-4 ring-pink-300/50">
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
                    className="text-4xl font-black mb-3"
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
                    className="text-xl opacity-90 mb-4 font-semibold"
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎂 {child.age} ans - Niveau Expert
                  </motion.p>

                  {/* Streak */}
                  {streak > 0 && (
                    <motion.div 
                      className="bg-white/20 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/30"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FlameIcon className="h-6 w-6 text-orange-300" />
                        <span className="text-lg font-bold">Série: {streak} jour{streak > 1 ? 's' : ''}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <motion.div 
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30"
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
                    Continue comme ça, champion ! 🌟
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <TaskList tasks={childTasks} progressPercentage={progressPercentage} completedTasks={completedTasks} totalTasks={totalTasks} onToggle={handleTaskToggle} />

          <RewardList rewards={rewards} claimedRewards={claimedRewards} child={child} onClaim={handleRewardClaim} />
          <PenaltyList penalties={penalties} />
          </div>
        <ShopItemsList child={child} onPointsUpdated={fetchChildData} />

        <PiggyBankManager child={child} onPointsUpdated={fetchChildData} />

          <DailyRiddle riddle={currentRiddle} solved={riddleSolved} answer={riddleAnswer} onAnswerChange={setRiddleAnswer} onSubmit={handleRiddleSubmit} showSuccess={showSuccess} />
      </motion.div>
    </motion.div>
  );
}
