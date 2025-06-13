import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { ChildProfile } from './child/ChildProfile';
import { ChildTasks } from './child/ChildTasks';
import { ChildRewards } from './child/ChildRewards';
import { ChildPenalties } from './child/ChildPenalties';
import { DailyRiddle } from './child/DailyRiddle';
import { SuccessAnimation } from './child/SuccessAnimation';

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
  title: string;
  description: string;
  points: number;
  status: 'pending' | 'completed' | 'overdue';
  due_date: string;
  child_id: string;
  created_at: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  child_id: string;
  created_at: string;
  is_claimed: boolean;
  claimed_at?: string;
}

interface Penalty {
  id: string;
  title: string;
  description: string;
  points_deduction: number;
  child_id: string;
  created_at: string;
  is_active: boolean;
  completed_at?: string;
  duration_hours: number;
}

interface Riddle {
  id: string;
  question: string;
  answer: string;
  hint: string;
  points: number;
  child_id: string;
  created_at: string;
  is_solved: boolean;
}

interface ChildTask {
  id: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string;
  created_at: string;
  tasks: {
    id: string;
    label: string;
    points_reward: number;
    is_daily: boolean;
  }[];
}

interface ChildReward {
  id: string;
  claimed_at: string;
  created_at: string;
  rewards: {
    id: string;
    label: string;
    cost: number;
  }[];
}

interface ChildPenalty {
  id: string;
  violated_at: string;
  created_at: string;
  rules: {
    id: string;
    label: string;
    points_penalty: number;
  }[];
}

export function DashboardChild() {
  const { user } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [dailyRiddle, setDailyRiddle] = useState<Riddle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPoints, setSuccessPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [conversionRate] = useState(100); // 100 points = 1€
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  const fetchChildren = async () => {
    try {
      setLoading(true);

      // Fetch all children for the user
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user?.id);

      if (childrenError) {
        console.error('Erreur lors de la récupération des enfants:', childrenError);
        throw childrenError;
      }

      if (!childrenData || childrenData.length === 0) {
        console.error('Aucun enfant trouvé pour l\'utilisateur:', user?.id);
        throw new Error('Aucun enfant trouvé');
      }

      setChildren(childrenData);

      // Si aucun enfant n'est sélectionné, sélectionner le premier
      if (!selectedChildId && childrenData.length > 0) {
        setSelectedChildId(childrenData[0].id);
      }

    } catch (error) {
      console.error('Erreur lors de la récupération des enfants:', error);
      alert('Une erreur est survenue lors du chargement des enfants. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      fetchChildData();
    }
  }, [selectedChildId]);

  const fetchChildData = async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);

      // Fetch child data
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('id', selectedChildId)
        .single();

      if (childError) {
        console.error('Erreur lors de la récupération des données de l\'enfant:', childError);
        throw childError;
      }

      if (!childData) {
        console.error('Aucune donnée d\'enfant trouvée pour l\'ID:', selectedChildId);
        throw new Error('Aucune donnée d\'enfant trouvée');
      }

      setChild(childData);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('child_tasks')
        .select(`
          id,
          is_completed,
          completed_at,
          due_date,
          created_at,
          tasks!inner (
            id,
            label,
            points_reward,
            is_daily
          )
        `)
        .eq('child_id', childData.id)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Erreur lors de la récupération des tâches:', tasksError);
        throw tasksError;
      }

      // Transformer les données pour correspondre à l'interface Task
      const transformedTasks: Task[] = (tasksData as ChildTask[] || [])
        .filter(task => task.tasks && task.tasks.length > 0)
        .map(task => ({
          id: task.id,
          title: task.tasks[0].label,
          description: task.tasks[0].label,
          points: task.tasks[0].points_reward,
          status: task.is_completed ? 'completed' : new Date(task.due_date) < new Date() ? 'overdue' : 'pending',
          due_date: task.due_date,
          child_id: childData.id,
          created_at: task.created_at
        }));

      setTasks(transformedTasks);

      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('child_rewards_claimed')
        .select(`
          id,
          claimed_at,
          created_at,
          rewards!inner (
            id,
            label,
            cost
          )
        `)
        .eq('child_id', childData.id)
        .order('created_at', { ascending: false });

      if (rewardsError) {
        console.error('Erreur lors de la récupération des récompenses:', rewardsError);
        throw rewardsError;
      }

      // Transformer les données pour correspondre à l'interface Reward
      const transformedRewards: Reward[] = (rewardsData as ChildReward[] || [])
        .filter(reward => reward.rewards && reward.rewards.length > 0)
        .map(reward => ({
          id: reward.id,
          title: reward.rewards[0].label,
          description: reward.rewards[0].label,
          points_cost: reward.rewards[0].cost,
          child_id: childData.id,
          created_at: reward.created_at,
          is_claimed: true,
          claimed_at: reward.claimed_at
        }));

      setRewards(transformedRewards);

      // Fetch penalties
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from('child_rules_violations')
        .select(`
          id,
          violated_at,
          created_at,
          rules!inner (
            id,
            label,
            points_penalty
          )
        `)
        .eq('child_id', childData.id)
        .order('created_at', { ascending: false });

      if (penaltiesError) {
        console.error('Erreur lors de la récupération des pénalités:', penaltiesError);
        throw penaltiesError;
      }

      // Transformer les données pour correspondre à l'interface Penalty
      const transformedPenalties: Penalty[] = (penaltiesData as ChildPenalty[] || [])
        .filter(penalty => penalty.rules && penalty.rules.length > 0)
        .map(penalty => ({
          id: penalty.id,
          title: penalty.rules[0].label,
          description: penalty.rules[0].label,
          points_deduction: penalty.rules[0].points_penalty,
          child_id: childData.id,
          created_at: penalty.created_at,
          is_active: true,
          duration_hours: 24 // Par défaut, une pénalité dure 24 heures
        }));

      setPenalties(transformedPenalties);

      // Fetch daily riddle
      try {
        const { data: riddleData, error: riddleError } = await supabase
          .from('riddles')
          .select('*')
          .eq('child_id', childData.id)
          .eq('is_daily', true)
          .single();

        if (riddleError) {
          if (riddleError.code === '42703') {
            console.log('La table riddles n\'existe pas encore ou n\'a pas été correctement créée');
            setDailyRiddle(null);
          } else if (riddleError.code !== 'PGRST116') {
            console.error('Erreur lors de la récupération de la devinette:', riddleError);
            throw riddleError;
          }
        } else {
          setDailyRiddle(riddleData);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la devinette:', error);
        setDailyRiddle(null);
      }

      // Fetch streak
      try {
        const { data: streakData, error: streakError } = await supabase
          .from('streaks')
          .select('*')
          .eq('child_id', childData.id)
          .single();

        if (streakError) {
          if (streakError.code === '42P01') {
            console.log('La table streaks n\'existe pas encore');
            setStreak(0);
          } else if (streakError.code === 'PGRST116') {
            // Aucun streak trouvé, en créer un nouveau
            const { data: newStreak, error: insertError } = await supabase
              .from('streaks')
              .insert([
                {
                  child_id: childData.id,
                  current_streak: 0,
                  longest_streak: 0
                }
              ])
              .select()
              .single();

            if (insertError) {
              console.error('Erreur lors de la création du streak:', insertError);
              setStreak(0);
            } else {
              setStreak(newStreak.current_streak);
            }
          } else {
            console.error('Erreur lors de la récupération de la série:', streakError);
            throw streakError;
          }
        } else {
          setStreak(streakData.current_streak);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la série:', error);
        setStreak(0);
      }

    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des données:', error);
      alert('Une erreur est survenue lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      // Update points
      const { error: pointsError } = await supabase
        .from('children')
        .update({ points: child!.points + task.points })
        .eq('id', child!.id);

      if (pointsError) throw pointsError;

      // Show success animation
      setSuccessPoints(task.points);
      setShowSuccess(true);

      // Refresh data
      fetchChildData();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) return;

      if (child!.points < reward.points_cost) {
        alert('Points insuffisants !');
        return;
      }

      const { error } = await supabase
        .from('rewards')
        .update({ 
          is_claimed: true,
          claimed_at: new Date().toISOString()
        })
        .eq('id', rewardId);

      if (error) throw error;

      // Update points
      const { error: pointsError } = await supabase
        .from('children')
        .update({ points: child!.points - reward.points_cost })
        .eq('id', child!.id);

      if (pointsError) throw pointsError;

      // Show success animation
      setSuccessPoints(-reward.points_cost);
      setShowSuccess(true);

      // Refresh data
      fetchChildData();
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const handleSolveRiddle = async (riddleId: string, answer: string) => {
    try {
      const { error } = await supabase
        .from('riddles')
        .update({ is_solved: true })
        .eq('id', riddleId);

      if (error) throw error;

      // Update points
      const { error: pointsError } = await supabase
        .from('children')
        .update({ points: child!.points + dailyRiddle!.points })
        .eq('id', child!.id);

      if (pointsError) throw pointsError;

      // Show success animation
      setSuccessPoints(dailyRiddle!.points);
      setShowSuccess(true);

      // Refresh data
      fetchChildData();
    } catch (error) {
      console.error('Error solving riddle:', error);
    }
  };

  if (loading || !child) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {children.length > 1 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Sélectionner un enfant</h2>
          <div className="flex gap-4">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                className={`px-4 py-2 rounded-lg ${
                  selectedChildId === c.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <ChildProfile 
          child={child} 
          streak={streak}
          conversionRate={conversionRate}
        />
        
        <ChildTasks 
          tasks={tasks}
          onTaskComplete={handleTaskComplete}
        />
        
        <ChildRewards 
          rewards={rewards}
          onClaimReward={handleClaimReward}
          childPoints={child.points}
        />
        
        <ChildPenalties 
          penalties={penalties}
        />
        
        {dailyRiddle && (
          <DailyRiddle 
            riddle={dailyRiddle}
            onSolve={handleSolveRiddle}
          />
        )}
      </div>

      <SuccessAnimation 
        show={showSuccess}
        points={successPoints}
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
} 