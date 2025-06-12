import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GiftIcon, TrophyIcon, ListChecksIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

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

export default function DashboardChild() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { childId } = useParams();
  const [child, setChild] = useState<Child | null>(null);
  const [childTasks, setChildTasks] = useState<ChildTask[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && childId) {
      fetchChildData();
    }
  }, [user, loading, navigate, childId]);

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
        .eq('due_date', new Date().toISOString().split('T')[0]);

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

      // Mettre à jour les points de l'enfant si la tâche est complétée
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
        title: 'Succès',
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

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p>Chargement du tableau de bord enfant...</p>
      </div>
    );
  }

  if (!user || !child) {
    return null;
  }

  const totalTasks = childTasks.length;
  const completedTasks = childTasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Mon Tableau de Bord</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil de l'enfant */}
        <Card className={`lg:col-span-1 p-6 flex flex-col items-center ${child.custom_color || 'bg-blue-100 text-blue-800'}`}>
          <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-lg">
            <AvatarImage src={child.avatar_url} alt={child.name} />
            <AvatarFallback>{child.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-extrabold mb-2">{child.name}</CardTitle>
          <p className="text-lg mb-4">Âge: {child.age} ans</p>
          <div className="flex items-center text-2xl font-semibold">
            <TrophyIcon className="h-6 w-6 mr-2 text-yellow-500" />
            Points: {child.points}
          </div>
        </Card>

        {/* Tâches du jour */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListChecksIcon className="mr-2 h-6 w-6" /> Mes Tâches du Jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Progression des tâches ({completedTasks}/{totalTasks})</p>
              <Progress value={progressPercentage} className="w-full" />
            </div>
            <div className="space-y-3">
              {childTasks.map((childTask) => (
                <div key={childTask.id} className="flex items-center space-x-3 p-3 border rounded-md bg-card">
                  <Checkbox
                    id={`task-${childTask.id}`}
                    checked={childTask.is_completed}
                    onCheckedChange={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                  />
                  <Label htmlFor={`task-${childTask.id}`} className="flex-1 text-lg font-medium">
                    {childTask.task.label}
                  </Label>
                  <span className="text-primary font-semibold">+{childTask.task.points_reward} points</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Récompenses disponibles */}
        <Card className="lg:col-span-3 p-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <GiftIcon className="mr-2 h-6 w-6" /> Récompenses Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <Card key={reward.id} className="p-4 flex flex-col items-center text-center">
                  <h3 className="text-xl font-semibold mb-2">{reward.label}</h3>
                  <p className="text-muted-foreground mb-3">Coût: <span className="font-bold text-primary">{reward.cost} points</span></p>
                  <Button
                    className="w-full"
                    disabled={child.points < reward.cost}
                    onClick={() => handleRewardClaim(reward.id, reward.cost)}
                  >
                    Échanger ({reward.cost} pts)
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
