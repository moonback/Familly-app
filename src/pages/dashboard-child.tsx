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
        .eq('user_id', child.user_id) // Utiliser le user_id du parent
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
      } else {
        console.log('Aucune tâche appropriée trouvée pour cet âge');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la génération des tâches:', error);
  }
};

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
  const [claimedRewards, setClaimedRewards] = useState<ChildRewardClaimed[]>([]);

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

      // Générer des tâches appropriées à l'âge de l'enfant
      await generateAgeAppropriateTasks(childData);

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

      // Récupérer les récompenses réclamées
      const { data: claimedRewardsData, error: claimedRewardsError } = await supabase
        .from('child_rewards_claimed')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('child_id', childId)
        .order('claimed_at', { ascending: false });

      if (claimedRewardsError) throw claimedRewardsError;
      setClaimedRewards(claimedRewardsData);
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
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100"
      >
        <div className="text-center relative">
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity }
            }}
            className="rounded-full h-20 w-20 bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-6 flex items-center justify-center shadow-2xl"
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
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden"
    >
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-10 left-10 text-6xl opacity-20"
        >
          ⭐
        </motion.div>
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 30, 0],
            rotate: [0, -180, -360]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute top-20 right-20 text-5xl opacity-20"
        >
          🌟
        </motion.div>
        <motion.div 
          animate={{ 
            x: [0, 60, 0],
            y: [0, -40, 0],
            rotate: [0, 90, 180]
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute bottom-20 left-32 text-4xl opacity-20"
        >
          ✨
        </motion.div>
        <motion.div 
          animate={{ 
            x: [0, -40, 0],
            y: [0, 60, 0],
            rotate: [0, -90, -180]
          }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute bottom-32 right-16 text-5xl opacity-20"
        >
          🎈
        </motion.div>
      </div>

      {/* Animation de confettis */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -100, 
                  x: Math.random() * window.innerWidth,
                  opacity: 1,
                  scale: 1
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: 360,
                  scale: [1, 1.5, 0.5]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut"
                }}
                className="absolute text-3xl"
              >
                {['🎉', '🎊', '⭐', '🌟', '✨', '🎈'][Math.floor(Math.random() * 6)]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6">
        {/* En-tête avec titre amélioré */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotateY: { duration: 4, repeat: Infinity },
              scale: { duration: 2, repeat: Infinity }
            }}
            className="text-6xl mb-4"
          >
            🏰
          </motion.div>
          <motion.h1 
            className="text-4xl md:text-5xl font-black mb-3"
            style={{
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundSize: '300% 300%',
            }}
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Mon Royaume Magique
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-700 font-semibold mb-2"
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Bonjour Super Héros {child.name} ! 🦸‍♀️
          </motion.p>
          <motion.div 
            className="inline-flex items-center bg-white/70 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border border-purple-200"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
            <span className="text-lg font-medium text-gray-800">
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {/* Profil de l'enfant */}
          <motion.div
            initial={{ x: -100, opacity: 0, rotateY: -30 }}
            animate={{ x: 0, opacity: 1, rotateY: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.2 
            }}
            className="lg:col-span-3"
          >
            <Card className="relative overflow-hidden border-0 shadow-2xl h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-30" />
              
              <div className="relative p-6 text-center text-white h-full flex flex-col justify-between">
                <div>
                  <motion.div 
                    className="relative mb-6"
                    whileHover={{ 
                      scale: 1.15,
                      rotateY: 15,
                      rotateX: 5
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="absolute -inset-4 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full blur-lg opacity-50 animate-pulse" />
                    <Avatar className="relative h-28 w-28 mx-auto border-4 border-white shadow-2xl ring-4 ring-pink-300/50">
                      <AvatarImage src={child.avatar_url} alt={child.name} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                        {child.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div 
                      className="absolute -top-2 -right-2 text-2xl"
                      animate={{ rotate: [0, 20, -20, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      👑
                    </motion.div>
                  </motion.div>
                  
                  <motion.h2 
                    className="text-3xl font-black mb-2"
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
                    className="text-lg opacity-90 mb-6 font-semibold"
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎂 {child.age} ans - Niveau Expert
                  </motion.p>
                </div>
                
                <motion.div 
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30"
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: 'rgba(255,255,255,0.25)'
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity }
                      }}
                      className="mr-3"
                    >
                      <TrophyIcon className="h-8 w-8 text-yellow-300 drop-shadow-lg" />
                    </motion.div>
                    <span className="text-sm font-semibold text-yellow-100">Points Magiques</span>
                  </div>
                  <motion.div
                    className="text-4xl font-black mb-2"
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
                  <div className="text-xs text-yellow-100 font-medium">
                    Continue comme ça, champion ! 🌟
                  </div>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Section des tâches */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.4 
            }}
            className="lg:col-span-6"
          >
            <Card className="shadow-2xl border-0 overflow-hidden h-full bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl font-bold text-gray-800">Mes Tâches</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Progression</span>
                      <Progress value={progressPercentage} className="w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {childTasks.map((childTask) => (
                      <motion.div
                        key={childTask.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                          childTask.is_completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Checkbox
                          checked={childTask.is_completed}
                          onCheckedChange={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                          className="h-6 w-6"
                        />
                        <div className="flex-1">
                          <Label className="text-lg font-medium">
                            {childTask.task.label}
                          </Label>
                          <p className="text-sm text-gray-500">
                            {childTask.task.points_reward} points
                          </p>
                        </div>
                        {childTask.is_completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-500"
                          >
                            <CheckCircleIcon className="h-6 w-6" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>

          {/* Section des récompenses */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.6 
            }}
            className="lg:col-span-3"
          >
            <Card className="shadow-2xl border-0 overflow-hidden h-full bg-white/80 backdrop-blur-sm">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
                <CardTitle className="relative z-10 text-2xl font-bold text-gray-800">
                  Mes Récompenses
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {rewards.map((reward) => (
                    <motion.div
                      key={reward.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-lg border-2 ${
                        child?.points >= reward.cost
                          ? 'bg-white border-purple-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{reward.label}</h4>
                          <p className="text-sm text-gray-500">{reward.cost} points</p>
                        </div>
                        <Button
                          onClick={() => handleRewardClaim(reward.id, reward.cost)}
                          disabled={!child || child.points < reward.cost}
                          className={`${
                            child?.points >= reward.cost
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'bg-gray-400'
                          }`}
                        >
                          <GiftIcon className="h-4 w-4 mr-2" />
                          Obtenir
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section des récompenses réclamées */}
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.8 
            }}
            className="lg:col-span-12 mt-6"
          >
            <Card className="shadow-2xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
                <CardTitle className="relative z-10 text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <TrophyIcon className="h-6 w-6 text-purple-600" />
                  Mes Récompenses Obtenues
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {claimedRewards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {claimedRewards.map((claimedReward) => (
                      <motion.div
                        key={claimedReward.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border-2 bg-white border-purple-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-purple-100">
                            <GiftIcon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{claimedReward.reward.label}</h4>
                            <p className="text-sm text-gray-500">
                              Obtenue le {format(new Date(claimedReward.claimed_at), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tu n'as pas encore obtenu de récompenses.</p>
                    <p className="text-sm text-gray-400 mt-2">Continue à accomplir tes tâches pour gagner des points !</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Section de la devinette quotidienne */}
        {currentRiddle && !riddleSolved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <BrainIcon className="h-6 w-6 text-purple-600" />
                  Devinette du Jour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRiddleSubmit} className="space-y-4">
                  <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-100">
                    <p className="text-lg font-medium text-gray-800 mb-4">
                      {currentRiddle.question}
                    </p>
                    <div className="flex gap-4">
                      <Input
                        type="text"
                        value={riddleAnswer}
                        onChange={(e) => setRiddleAnswer(e.target.value)}
                        placeholder="Ta réponse..."
                        className="flex-1"
                      />
                      <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                        Valider
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Animation de succès */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-2 border-green-200">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 1 }}
                  className="text-6xl mb-4 text-center"
                >
                  🎉
                </motion.div>
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
                  Bravo !
                </h3>
                <p className="text-gray-600 text-center">
                  Tu as gagné {currentRiddle?.points} points !
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}