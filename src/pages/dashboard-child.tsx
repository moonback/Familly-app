import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GiftIcon, TrophyIcon, ListChecksIcon, StarIcon, CheckCircleIcon, PartyPopperIcon, BrainIcon, CalendarIcon, FlameIcon, SparklesIcon, AlertCircle, Clock, BookOpenIcon } from 'lucide-react';
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
import { ManualButton, ManualDialog } from '@/components/manual/manual-dialog';

// Import des nouveaux composants
import { AvatarDisplay } from '@/components/dashboard/AvatarDisplay';
import { TaskList } from '@/components/dashboard/TaskList';
import { RewardShop } from '@/components/dashboard/RewardShop';
import { DailyRiddle } from '@/components/dashboard/DailyRiddle';
import { SuccessAnimation } from '@/components/dashboard/SuccessAnimation';
import { LoadingScreen } from '@/components/dashboard/LoadingScreen';
import { BackgroundDecorations } from '@/components/dashboard/BackgroundDecorations';
import { Header } from '@/components/dashboard/Header';
import { ValidatedRewardsList } from '@/components/dashboard/ValidatedRewardsList';

const CONVERSION_RATE = 100; // 100 points = 1 euro

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
        .gte('age_max', child.age)
        .order('points_reward', { ascending: false });

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
        console.log('Aucune tâche appropriée trouvée pour l\'âge de l\'enfant');
        toast({
          title: 'Information',
          description: "Aucune tâche n'est disponible pour l'âge de l'enfant",
          variant: 'default',
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors de la génération des tâches:', error);
    toast({
      title: 'Erreur',
      description: "Impossible de générer les tâches",
      variant: 'destructive',
    });
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
  const [showManual, setShowManual] = useState(false);

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
        .not('reason', 'ilike', 'Récompense réclamée%')
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
      console.log('Fetching daily riddle for child:', child?.id);
      
      // Vérifier d'abord si l'enfant a déjà une devinette pour aujourd'hui
      const { data: existingRiddle, error: checkError } = await supabase
        .from('daily_riddles')
        .select(`
          *,
          riddles (
            id,
            question,
            answer,
            points,
            hint
          )
        `)
        .eq('child_id', child?.id)
        .eq('date', format(new Date(), 'yyyy-MM-dd'))
        .single();

      console.log('Existing riddle check:', { existingRiddle, checkError });

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification de la devinette:', checkError);
        return;
      }

      if (existingRiddle) {
        console.log('Using existing riddle:', existingRiddle);
        setCurrentRiddle(existingRiddle.riddles);
        setRiddleSolved(existingRiddle.is_solved);
        return;
      }

      // Si aucune devinette n'existe pour aujourd'hui, en créer une nouvelle
      const { data: riddles, error: riddleError } = await supabase
        .from('riddles')
        .select(`
          id,
          question,
          answer,
          points,
          hint
        `)
        .eq('user_id', child?.user_id);

      console.log('Available riddles:', { riddles, riddleError });

      if (riddleError) {
        console.error('Erreur lors de la récupération des devinettes:', riddleError);
        return;
      }

      if (riddles && riddles.length > 0) {
        // Sélectionner une devinette aléatoire
        const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];
        console.log('Selected random riddle:', randomRiddle);

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

        console.log('Created daily riddle:', { dailyRiddle, insertError });

        if (insertError) {
          console.error('Erreur lors de la création de la devinette quotidienne:', insertError);
          return;
        }

        setCurrentRiddle({ ...randomRiddle, is_solved: false });
        setRiddleSolved(false);
      } else {
        console.log('Aucune devinette disponible pour cet utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la devinette:', error);
    }
  };

  const handleTaskToggle = async (childTaskId: string, isCompleted: boolean) => {
    try {
      // Vérifier si la tâche a déjà été complétée aujourd'hui
      const { data: existingCompletion, error: checkError } = await supabase
        .from('child_tasks')
        .select('completed_at')
        .eq('id', childTaskId)
        .eq('due_date', format(new Date(), 'yyyy-MM-dd'))
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Si la tâche a déjà été complétée aujourd'hui, afficher un message
      if (existingCompletion?.completed_at) {
        toast({
          title: 'Information',
          description: "Cette tâche a déjà été complétée aujourd'hui",
          variant: 'default',
        });
        return;
      }

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

  const handleRiddleSubmit = async (answer: string) => {
    if (!currentRiddle || !answer.trim() || !child) return;

    try {
      const isCorrect = answer.toLowerCase().trim() === currentRiddle.answer.toLowerCase().trim();
      
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

  const handleHintPurchase = async () => {
    if (!child || !currentRiddle) return;

    try {
      // Vérifier si l'enfant a assez de points
      if (child.points < 10) {
        toast({
          title: "Points insuffisants",
          description: "Il te faut 10 points pour obtenir un indice",
          variant: "destructive",
        });
        return;
      }

      // Déduire les points
      const { error: updateError } = await supabase
        .from('children')
        .update({
          points: child.points - 10
        })
        .eq('id', child.id);

      if (updateError) throw updateError;

      // Enregistrer dans l'historique des points
      const { error: historyError } = await supabase
        .from('points_history')
        .insert([{
          user_id: child.user_id,
          child_id: child.id,
          points: -10,
          reason: 'Achat d\'indice pour la devinette'
        }]);

      if (historyError) console.error('Erreur historique:', historyError);

      // Mettre à jour l'état local
      setChild(prev => prev ? { ...prev, points: prev.points - 10 } : null);

      toast({
        title: "Indice acheté !",
        description: "10 points ont été déduits de ton compte",
      });
    } catch (error) {
      console.error('Erreur lors de l\'achat de l\'indice:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'acheter l'indice",
        variant: "destructive",
      });
    }
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

  if (loading || isLoading) {
    return <LoadingScreen />;
  }

  if (!user || !child) {
    return null;
  }

  const totalTasks = childTasks.length;
  const completedTasks = childTasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="container mx-auto p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          '--child-color': child?.custom_color || '#8B5CF6',
        } as React.CSSProperties}
        className={`min-h-screen relative overflow-hidden ${
          child?.custom_color
            ? 'bg-[linear-gradient(135deg,var(--child-color)_20,var(--child-color)_10,#f8fafc)]'
            : 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
        }`}
      >
        <BackgroundDecorations />

        <motion.div className="relative z-10 p-6">
          <Header 
            childName={child.name} 
            onManualClick={() => setShowManual(true)} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-12xl mx-auto">
            <AvatarDisplay child={child} streak={streak} />
            <TaskList 
              childTasks={childTasks} 
              onTaskToggle={handleTaskToggle} 
              childColor={child.custom_color} 
            />
            <RewardShop 
              rewards={rewards} 
              childPoints={child.points} 
              onRewardClaim={handleRewardClaim} 
              childColor={child.custom_color} 
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <ShopItemsList 
              child={child} 
              onPointsUpdated={fetchChildData}
              className="transform hover:scale-[1.01] transition-transform duration-300" 
            />

            <PiggyBankManager 
              child={child} 
              onPointsUpdated={fetchChildData}
              className="transform hover:scale-[1.01] transition-transform duration-300"
            />

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrophyIcon className="w-6 h-6" />
                Mes Récompenses Validées
              </h2>
              <ValidatedRewardsList 
                claimedRewards={claimedRewards} 
                childColor={child.custom_color}
              />
            </div>
          </motion.div>

          <DailyRiddle 
            riddle={currentRiddle} 
            isSolved={riddleSolved} 
            onRiddleSubmit={handleRiddleSubmit} 
            childColor={child.custom_color}
            childPoints={child.points}
            onHintPurchase={handleHintPurchase}
          />

          <SuccessAnimation 
            show={showSuccess} 
            points={currentRiddle?.points || 0} 
          />

          <ManualDialog open={showManual} onOpenChange={setShowManual} />
        </motion.div>
      </motion.div>
    </div>
  );
}
