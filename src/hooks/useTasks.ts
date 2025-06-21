import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Child, ChildTask, Task } from '@/types/dashboard';
import { toast } from '@/hooks/use-toast';

export const useTasks = (child: Child | null, onPointsUpdated: () => void) => {
  const [childTasks, setChildTasks] = useState<ChildTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkAndFixTaskData = async () => {
    if (!child) return;

    try {
      // Vérifier s'il y a des tâches sans age_min ou age_max
      const { data: incompleteTasks, error: checkError } = await supabase
        .from('tasks')
        .select('id, label, age_min, age_max')
        .eq('user_id', child.user_id)
        .or('age_min.is.null,age_max.is.null');

      if (checkError) {
        console.error('Erreur lors de la vérification des tâches incomplètes:', checkError);
        return;
      }

      if (incompleteTasks && incompleteTasks.length > 0) {
        console.warn(`${incompleteTasks.length} tâches sans âge défini trouvées`);
        
        // Mettre à jour les tâches avec des valeurs par défaut
        for (const task of incompleteTasks) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({
              age_min: task.age_min || 3,
              age_max: task.age_max || 18
            })
            .eq('id', task.id);

          if (updateError) {
            console.error('Erreur lors de la mise à jour de la tâche:', updateError);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des données:', error);
    }
  };

  const generateAgeAppropriateTasks = async () => {
    if (!child) return;

    // Vérifier que l'enfant a un âge défini
    if (!child.age || child.age < 1) {
      console.warn('L\'enfant n\'a pas d\'âge défini ou l\'âge est invalide');
      toast({
        title: 'Information',
        description: "Veuillez définir l'âge de l'enfant pour générer des tâches appropriées",
        variant: 'default',
      });
      return;
    }

    try {
      // Vérifier et corriger les données des tâches
      await checkAndFixTaskData();

      const { data: existingTasks, error: checkError } = await supabase
        .from('child_tasks')
        .select('*')
        .eq('child_id', child.id)
        .eq('due_date', format(new Date(), 'yyyy-MM-dd'));

      if (checkError) {
        console.error('Erreur lors de la vérification des tâches existantes:', checkError);
        toast({
          title: 'Erreur',
          description: "Impossible de vérifier les tâches existantes",
          variant: 'destructive',
        });
        return;
      }

      if (!existingTasks || existingTasks.length === 0) {
        const { data: ageAppropriateTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', child.user_id)
          .not('age_min', 'is', null)
          .not('age_max', 'is', null)
          .lte('age_min', child.age)
          .gte('age_max', child.age)
          .order('points_reward', { ascending: false });

        if (tasksError) {
          console.error('Erreur lors de la récupération des tâches:', tasksError);
          toast({
            title: 'Erreur',
            description: "Impossible de récupérer les tâches appropriées",
            variant: 'destructive',
          });
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
            try {
              const { error: insertError } = await supabase
                .from('child_tasks')
                .insert([{
                  child_id: child.id,
                  task_id: task.id,
                  due_date: format(new Date(), 'yyyy-MM-dd'),
                  is_completed: false
                }]);

              if (insertError) {
                console.error('Erreur lors de la création de la tâche:', {
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint,
                  code: insertError.code
                });
                toast({
                  title: 'Erreur',
                  description: `Impossible de créer la tâche: ${task.label}`,
                  variant: 'destructive',
                });
              }
            } catch (taskError) {
              console.error('Erreur lors de la création de la tâche:', taskError);
              toast({
                title: 'Erreur',
                description: `Erreur lors de la création de la tâche: ${task.label}`,
                variant: 'destructive',
              });
            }
          }
        } else {
          console.warn('Aucune tâche appropriée trouvée pour l\'âge de l\'enfant');
          toast({
            title: 'Information',
            description: "Aucune tâche appropriée trouvée pour l'âge de l'enfant",
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