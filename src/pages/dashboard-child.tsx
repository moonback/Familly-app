import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GiftIcon, TrophyIcon, ListChecksIcon, StarIcon, SparklesIcon, CheckCircleIcon } from 'lucide-react';
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
  const [completedTasksAnimation, setCompletedTasksAnimation] = useState<string[]>([]);

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
          
          // Animation de célébration
          setCompletedTasksAnimation(prev => [...prev, childTaskId]);
          setTimeout(() => {
            setCompletedTasksAnimation(prev => prev.filter(id => id !== childTaskId));
          }, 2000);
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

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Chargement de ton tableau de bord...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header avec animation */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 animate-pulse">
            🌟 Mon Tableau de Bord 🌟
          </h1>
          <p className="text-xl text-gray-600 font-medium">Salut {child.name} ! Prêt pour une journée incroyable ?</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profil de l'enfant - Version améliorée */}
          <Card className="lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
            <div className="relative p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-4 ring-purple-300">
                  <AvatarImage src={child.avatar_url} alt={child.name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {child.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-bounce">
                  <StarIcon className="h-6 w-6 text-yellow-800" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-2">{child.name}</h2>
              <p className="text-lg opacity-90 mb-6">🎂 {child.age} ans</p>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 w-full">
                <div className="flex items-center justify-center text-3xl font-bold mb-2">
                  <TrophyIcon className="h-8 w-8 mr-3 text-yellow-300 animate-pulse" />
                  <span className="bg-gradient-to-r from-yellow-200 to-yellow-100 bg-clip-text text-transparent">
                    {child.points} Points
                  </span>
                </div>
                <div className="flex justify-center space-x-1">
                  {[...Array(Math.min(5, Math.floor(child.points / 10)))].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-300 fill-current animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Tâches du jour - Version améliorée */}
          <Card className="lg:col-span-2 shadow-xl bg-white/80 backdrop-blur-sm border-0">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center">
                <ListChecksIcon className="mr-3 h-7 w-7" />
                🎯 Mes Missions du Jour
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-semibold text-gray-700">
                    Progression ({completedTasks}/{totalTasks})
                  </span>
                  <span className="text-2xl">
                    {progressPercentage === 100 ? '🎉' : progressPercentage >= 50 ? '💪' : '🚀'}
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="w-full h-4 bg-gray-200 rounded-full overflow-hidden"
                />
                {progressPercentage === 100 && (
                  <div className="text-center mt-3 animate-bounce">
                    <span className="text-2xl">🎊 Toutes les missions accomplies ! 🎊</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {childTasks.map((childTask) => (
                  <div 
                    key={childTask.id} 
                    className={`relative flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                      childTask.is_completed 
                        ? 'bg-green-50 border-green-200 shadow-md' 
                        : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
                    } ${completedTasksAnimation.includes(childTask.id) ? 'animate-pulse bg-yellow-100' : ''}`}
                  >
                    {completedTasksAnimation.includes(childTask.id) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <SparklesIcon className="h-8 w-8 text-yellow-500 animate-spin" />
                      </div>
                    )}
                    
                    <div className="relative">
                      <Checkbox
                        id={`task-${childTask.id}`}
                        checked={childTask.is_completed}
                        onCheckedChange={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                        className="h-6 w-6 border-2 border-purple-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      {childTask.is_completed && (
                        <CheckCircleIcon className="absolute -top-1 -right-1 h-4 w-4 text-green-500 animate-bounce" />
                      )}
                    </div>
                    
                    <Label 
                      htmlFor={`task-${childTask.id}`} 
                      className={`flex-1 text-lg font-medium cursor-pointer ${
                        childTask.is_completed ? 'line-through text-green-600' : 'text-gray-800'
                      }`}
                    >
                      {childTask.task.label}
                    </Label>
                    
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                      childTask.is_completed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      +{childTask.task.points_reward} points
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Récompenses disponibles - Version améliorée */}
          <Card className="lg:col-span-3 shadow-xl bg-white/80 backdrop-blur-sm border-0">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center">
                <GiftIcon className="mr-3 h-7 w-7" />
                🎁 Boutique de Récompenses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <Card 
                    key={reward.id} 
                    className={`relative overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                      child.points >= reward.cost 
                        ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 shadow-lg' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 transform rotate-45 translate-x-8 -translate-y-8"></div>
                    <div className="relative p-6 flex flex-col items-center text-center">
                      <div className="text-4xl mb-4">
                        {child.points >= reward.cost ? '🎉' : '🔒'}
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-800">{reward.label}</h3>
                      <p className="text-gray-600 mb-4">
                        Coût: <span className="font-bold text-lg text-purple-600">{reward.cost} points</span>
                      </p>
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
                    </div>
                  </Card>
                ))}
              </div>
              
              {rewards.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎁</div>
                  <p className="text-xl text-gray-600">Aucune récompense disponible pour le moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}