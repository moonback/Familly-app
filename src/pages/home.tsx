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
  const [child, setChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<ChildTask[]>([]);
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
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
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

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('child_tasks')
        .update({ 
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
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
        
        // Animation de célébration
        setCompletedTasksAnimation(prev => [...prev, taskId]);
        setTimeout(() => {
          setCompletedTasksAnimation(prev => prev.filter(id => id !== taskId));
        }, 2000);
      }

      toast({
        title: !isCompleted ? '🎉 Bravo !' : 'Tâche mise à jour',
        description: !isCompleted ? `Tu as gagné ${task?.task.points_reward} points !` : 'La tâche a été mise à jour',
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour la tâche",
        variant: 'destructive',
      });
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

  if (!user || !child) {
    return null;
  }

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🏠 Tableau de Bord de {child.name}
            </h1>
            <div className="flex items-center justify-center gap-4 mt-4">
              <img 
                src={child.avatar_url} 
                alt={child.name} 
                className="w-16 h-16 rounded-full border-4 border-purple-300 shadow-lg"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-6 w-6 text-yellow-400" />
                  <span className="text-2xl font-bold text-purple-600">{child.points} points</span>
                </div>
                <div className="text-gray-600">Progression des tâches</div>
              </div>
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <ListChecksIcon className="mr-3 h-6 w-6" />
                Mes Missions du Jour
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-semibold text-gray-700">
                    Progression ({completedTasks}/{tasks.length})
                  </span>
                  <span className="text-2xl">
                    {progress === 100 ? '🎉' : progress >= 50 ? '💪' : '🚀'}
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              <div className="space-y-4">
                {tasks.map((childTask) => (
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
                        className="h-6 w-6 border-2 border-purple-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 cursor-pointer hover:scale-110 transition-transform"
                      />
                      {childTask.is_completed && (
                        <CheckCircleIcon className="absolute -top-1 -right-1 h-4 w-4 text-green-500 animate-bounce" />
                      )}
                    </div>
                    
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
                    
                    <div className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                      childTask.is_completed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}>
                      +{childTask.task.points_reward} points
                    </div>
                  </div>
                ))}

                {tasks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-xl text-gray-600">Aucune mission pour aujourd'hui !</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 