import { useAuth } from '@/context/auth-context';
import { useEffect, useState, useCallback } from 'react';
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
import { PointsHistoryList } from '@/components/dashboard/PointsHistoryList';

// Hooks personnalisés
import { useTasks } from '@/hooks/useTasks';
import { useRewards } from '@/hooks/useRewards';
import { useRiddles } from '@/hooks/useRiddles';
import { useStreak } from '@/hooks/useStreak';
import { usePointsHistory } from '@/hooks/usePointsHistory';

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
        // Grouper les tâches par catégorie
        const tasksByCategory = {
          quotidien: ageAppropriateTasks.filter(task => task.category === 'quotidien'),
          scolaire: ageAppropriateTasks.filter(task => task.category === 'scolaire'),
          maison: ageAppropriateTasks.filter(task => task.category === 'maison'),
          personnel: ageAppropriateTasks.filter(task => task.category === 'personnel')
        };

        // Sélectionner 15 tâches équilibrées par catégorie
        const selectedTasks: Task[] = [];
        const tasksPerCategory = Math.ceil(15 / 4); // 4 catégories, ~4 tâches par catégorie

        Object.entries(tasksByCategory).forEach(([category, tasks]) => {
          if (tasks.length > 0) {
            // Mélanger les tâches de cette catégorie
            const shuffledTasks = tasks.sort(() => Math.random() - 0.5);
            // Prendre jusqu'à tasksPerCategory tâches de cette catégorie
            const categoryTasks = shuffledTasks.slice(0, tasksPerCategory);
            selectedTasks.push(...categoryTasks);
          }
        });

        // Si on n'a pas assez de tâches, compléter avec des tâches aléatoires
        if (selectedTasks.length < 15) {
          const remainingTasks = ageAppropriateTasks.filter(task => 
            !selectedTasks.some(selected => selected.id === task.id)
          );
          const additionalTasks = remainingTasks
            .sort(() => Math.random() - 0.5)
            .slice(0, 15 - selectedTasks.length);
          selectedTasks.push(...additionalTasks);
        }

        // Limiter à 15 tâches maximum
        const finalTasks = selectedTasks.slice(0, 15);

        // Créer les tâches dans la base de données
        for (const task of finalTasks) {
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
  const [showManual, setShowManual] = useState(false);
  const [completedTasksAnimation, setCompletedTasksAnimation] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchChildData = useCallback(async () => {
    try {
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('name', childName)
        .single();

      if (childError) throw childError;
      setChild(childData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les données",
        variant: 'destructive',
      });
    }
  }, [childName]);

  // Utilisation des hooks personnalisés
  const { childTasks, isLoading: tasksLoading, toggleTask } = useTasks(child, fetchChildData);
  const { rewards, claimedRewards, claimReward } = useRewards(child, fetchChildData);
  const { 
    currentRiddle, 
    riddleSolved, 
    showSuccess, 
    submitRiddleAnswer, 
    purchaseHint 
  } = useRiddles(child, fetchChildData);
  const { streak } = useStreak(child);
  const { pointsHistory } = usePointsHistory(child);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && childName) {
      fetchChildData();
    }
  }, [user, loading, navigate, childName]);

  const handleTaskToggle = async (childTaskId: string, isCompleted: boolean) => {
    await toggleTask(childTaskId, isCompleted);
    setCompletedTasksAnimation(prev => [...prev, childTaskId]);
    setShowConfetti(true);
    setTimeout(() => {
      setCompletedTasksAnimation(prev => prev.filter(id => id !== childTaskId));
      setShowConfetti(false);
    }, 3000);
  };

  if (loading || tasksLoading) {
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
          backgroundSize: 'cover',
          backgroundImage: child?.custom_color
            ? 'linear-gradient(135deg,var(--child-color) 20%,var(--child-color) 10%,#f8fafc)'
            : 'linear-gradient(to bottom right, #e0e7ff, #f3e8ff, #fce7f3)',
        } as React.CSSProperties}
        className="min-h-screen relative overflow-hidden"
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
              onRewardClaim={claimReward} 
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-6 h-6" />
                  Mes Récompenses Validées
                </h2>
                <ValidatedRewardsList 
                  claimedRewards={claimedRewards} 
                  childColor={child.custom_color}
                />
              </div>

              <PointsHistoryList 
                pointsHistory={pointsHistory}
                childColor={child.custom_color}
              />
            </div>
          </motion.div>

          <DailyRiddle 
            riddle={currentRiddle} 
            isSolved={riddleSolved} 
            onRiddleSubmit={submitRiddleAnswer} 
            childColor={child.custom_color}
            childPoints={child.points}
            onHintPurchase={purchaseHint}
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
