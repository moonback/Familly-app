import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Child, ChildTask, Task } from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';

export const useTasks = (child: Child | null, onPointsUpdated: () => void) => {
  const [childTasks, setChildTasks] = useState<ChildTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const generateAgeAppropriateTasks = async () => {
    if (!child) return;

    try {
      const { data: existingTasks, error: checkError } = await supabase
        .from('child_tasks')
        .select('*')
        .eq('child_id', child.id)
        .eq('due_date', format(new Date(), 'yyyy-MM-dd'));

      if (checkError) {
        console.error('Erreur lors de la vérification des tâches existantes:', checkError);
        return;
      }

      if (!existingTasks || existingTasks.length === 0) {
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
          const selectedTasks = ageAppropriateTasks
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

          for (const task of selectedTasks) {
            const { error: insertError } = await supabase
              .from('child_tasks')
              .insert([{
                child_id: child.id,
                task_id: task.id,
                due_date: format(new Date(), 'yyyy-MM-dd'),
                is_completed: false
              }]);

            if (insertError) {
              console.error('Erreur lors de la création de la tâche:', insertError);
            }
          }
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

  const fetchTasks = async () => {
    if (!child) return;

    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('child_tasks')
        .select(`
          *,
          task:tasks(*)
        `)
        .eq('child_id', child.id)
        .eq('due_date', format(new Date(), 'yyyy-MM-dd'))
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setChildTasks(tasksData);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les tâches",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (childTaskId: string, isCompleted: boolean) => {
    try {
      const { data: existingCompletion, error: checkError } = await supabase
        .from('child_tasks')
        .select('completed_at')
        .eq('id', childTaskId)
        .eq('due_date', format(new Date(), 'yyyy-MM-dd'))
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

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
        if (childTask && child) {
          const { error: updateError } = await supabase
            .from('children')
            .update({
              points: (child?.points || 0) + childTask.task.points_reward
            })
            .eq('id', child?.id);

          if (updateError) throw updateError;

          const { error: historyError } = await supabase
            .from('points_history')
            .insert([{
              user_id: child?.user_id,
              child_id: child?.id,
              points: childTask.task.points_reward,
              reason: `Tâche complétée: ${childTask.task.label}`,
              task_id: childTask.task.id
            }]);

          if (historyError) console.error('Erreur historique:', historyError);
          onPointsUpdated();
        }
      }

      await fetchTasks();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour la tâche",
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (child) {
      generateAgeAppropriateTasks();
      fetchTasks();
    }
  }, [child]);

  return {
    childTasks,
    isLoading,
    toggleTask,
    refreshTasks: fetchTasks
  };
}; 