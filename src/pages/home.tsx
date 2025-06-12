import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { ListChecksIcon, StarIcon, SparklesIcon, CheckCircleIcon, Loader2 } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  points: number;
  avatar_url: string;
}

interface Task {
  id: string;
  label: string;
  points_reward: number;
  is_daily: boolean;
}

interface ChildTask {
  id: string;
  child_id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string;
  task: Task;
}

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { childId } = useParams();
  const [children, setChildren] = useState<Child[]>([]);
  const [childTasks, setChildTasks] = useState<ChildTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completedTasksAnimation, setCompletedTasksAnimation] = useState<string[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<ChildTask[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    try {
      // Récupérer les enfants
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user?.id);

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

      // Récupérer toutes les tâches des enfants
      const { data: tasksData, error: tasksError } = await supabase
        .from('child_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .in('child_id', childrenData?.map(child => child.id) || [])
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setChildTasks(tasksData || []);

      if (childId) {
        fetchChildData();
      }
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
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('child_tasks')
        .update({ is_completed: !isCompleted })
        .eq('id', taskId);

      if (error) throw error;

      // Mettre à jour l'état local
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, is_completed: !isCompleted }
          : task
      ));

      // Mettre à jour les points de l'enfant
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const pointsChange = !isCompleted ? task.task.points_reward : -task.task.points_reward;
        const { error: updateError } = await supabase
          .from('children')
          .update({ points: (child?.points || 0) + pointsChange })
          .eq('id', childId);

        if (updateError) throw updateError;
        setChild(prev => prev ? { ...prev, points: prev.points + pointsChange } : null);
      }

      toast.success(isCompleted ? 'Tâche marquée comme non terminée' : 'Tâche terminée !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error('Erreur lors de la mise à jour de la tâche');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          🏠 Tableau de Bord Familial
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const childTasksList = childTasks.filter(task => task.child_id === child.id);
            const totalTasks = childTasksList.length;
            const completedTasks = childTasksList.filter(t => t.is_completed).length;
            const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <Card key={child.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <img 
                        src={child.avatar_url} 
                        alt={child.name} 
                        className="w-8 h-8 rounded-full mr-2 border-2 border-white"
                      />
                      {child.name}
                    </span>
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-300 mr-1" />
                      <span>{child.points} points</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Progression ({completedTasks}/{totalTasks})
                      </span>
                      <span className="text-lg">
                        {progressPercentage === 100 ? '🎉' : progressPercentage >= 50 ? '💪' : '🚀'}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    {childTasksList.map((childTask) => (
                      <div 
                        key={childTask.id} 
                        className={`relative flex items-center space-x-3 p-3 rounded-lg border transition-all duration-300 ${
                          childTask.is_completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        } ${completedTasksAnimation.includes(childTask.id) ? 'animate-pulse bg-yellow-100' : ''}`}
                      >
                        {completedTasksAnimation.includes(childTask.id) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="h-6 w-6 text-yellow-500 animate-spin" />
                          </div>
                        )}
                        
                        <div className="relative">
                          <Checkbox
                            id={`task-${childTask.id}`}
                            checked={childTask.is_completed}
                            onCheckedChange={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                            className="h-5 w-5 border-2 border-purple-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          {childTask.is_completed && (
                            <CheckCircleIcon className="absolute -top-1 -right-1 h-3 w-3 text-green-500 animate-bounce" />
                          )}
                        </div>
                        
                        <Label 
                          htmlFor={`task-${childTask.id}`} 
                          className={`flex-1 text-sm font-medium cursor-pointer ${
                            childTask.is_completed ? 'line-through text-green-600' : 'text-gray-800'
                          }`}
                        >
                          {childTask.task.label}
                        </Label>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          childTask.is_completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          +{childTask.task.points_reward}
                        </div>
                      </div>
                    ))}

                    {childTasksList.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        Aucune tâche pour le moment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-4">Bonjour {child?.name} !</h2>
          <div className="flex items-center gap-4">
            <div className="text-lg">
              Points: <span className="font-bold text-purple-600">{child?.points}</span>
            </div>
            <div className="flex-1">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500 mt-1">
                {completedTasks} tâches terminées sur {tasks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Mes Missions du Jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((childTask) => (
                  <div
                    key={childTask.id}
                    className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={childTask.id}
                      checked={childTask.is_completed}
                      onCheckedChange={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                      className="h-5 w-5 cursor-pointer hover:scale-110 transition-transform"
                    />
                    <Label
                      htmlFor={childTask.id}
                      className={`flex-1 cursor-pointer ${
                        childTask.is_completed ? 'line-through text-gray-500' : ''
                      } hover:text-purple-600 transition-colors`}
                    >
                      {childTask.task.label}
                    </Label>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      childTask.is_completed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors'
                    }`}>
                      +{childTask.task.points_reward} points
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Aucune mission pour aujourd'hui !
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 