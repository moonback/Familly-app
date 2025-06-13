import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { PlusCircleIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

interface Task {
  id: string;
  label: string;
  points_reward: number;
  is_daily: boolean;
  age_min: number;
  age_max: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
  created_at: string;
  user_id: string;
}

export function TasksManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    points_reward: '',
    is_daily: true,
    age_min: '3',
    age_max: '18',
    category: 'quotidien' as 'quotidien' | 'scolaire' | 'maison' | 'personnel',
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de charger la liste des tâches",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Erreur',
        description: "Vous devez être connecté pour ajouter une tâche",
        variant: 'destructive',
      });
      return;
    }

    try {
      const taskData = {
        label: formData.label,
        points_reward: parseInt(formData.points_reward),
        is_daily: formData.is_daily,
        age_min: parseInt(formData.age_min),
        age_max: parseInt(formData.age_max),
        category: formData.category,
        user_id: user.id,
      };

      let taskId: string;
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id)
          .eq('user_id', user.id);

        if (error) throw error;
        taskId = editingTask.id;
        toast({
          title: 'Succès',
          description: "La tâche a été mise à jour avec succès",
        });
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (error) throw error;
        taskId = data.id;
        toast({
          title: 'Succès',
          description: "La tâche a été ajoutée avec succès",
        });

        // Récupérer tous les enfants de l'utilisateur dans la tranche d'âge
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id, age')
          .eq('user_id', user.id)
          .gte('age', taskData.age_min)
          .lte('age', taskData.age_max);

        if (childrenError) throw childrenError;

        // Créer les tâches pour chaque enfant éligible
        if (children && children.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const childTasks = children.map(child => ({
            child_id: child.id,
            task_id: taskId,
            due_date: today,
            is_completed: false
          }));

          const { error: childTasksError } = await supabase
            .from('child_tasks')
            .insert(childTasks);

          if (childTasksError) throw childTasksError;
        }
      }

      setIsDialogOpen(false);
      setEditingTask(null);
      setFormData({ 
        label: '', 
        points_reward: '', 
        is_daily: true, 
        age_min: '3', 
        age_max: '18', 
        category: 'quotidien' 
      });
      fetchTasks();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      label: task.label,
      points_reward: task.points_reward.toString(),
      is_daily: task.is_daily,
      age_min: task.age_min?.toString() || '3',
      age_max: task.age_max?.toString() || '18',
      category: task.category || 'quotidien',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: "Vous devez être connecté pour supprimer une tâche",
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({
        title: 'Succès',
        description: "La tâche a été supprimée avec succès",
      });
      fetchTasks();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer la tâche",
        variant: 'destructive',
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      quotidien: 'Quotidien',
      scolaire: 'Scolaire',
      maison: 'Maison',
      personnel: 'Personnel'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      quotidien: 'bg-blue-100 text-blue-800',
      scolaire: 'bg-green-100 text-green-800',
      maison: 'bg-orange-100 text-orange-800',
      personnel: 'bg-purple-100 text-purple-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Tâches</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Ajouter une tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Modifier une tâche' : 'Ajouter une tâche'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Description</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points_reward">Points de récompense</Label>
                <Input
                  id="points_reward"
                  type="number"
                  value={formData.points_reward}
                  onChange={(e) => setFormData({ ...formData, points_reward: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quotidien">Quotidien</SelectItem>
                    <SelectItem value="scolaire">Scolaire</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="personnel">Personnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age_min">Âge minimum</Label>
                  <Input
                    id="age_min"
                    type="number"
                    min="3"
                    max="18"
                    value={formData.age_min}
                    onChange={(e) => setFormData({ ...formData, age_min: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age_max">Âge maximum</Label>
                  <Input
                    id="age_max"
                    type="number"
                    min="3"
                    max="18"
                    value={formData.age_max}
                    onChange={(e) => setFormData({ ...formData, age_max: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_daily"
                  checked={formData.is_daily}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_daily: checked as boolean })}
                />
                <Label htmlFor="is_daily">Tâche quotidienne</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingTask ? 'Modifier' : 'Ajouter'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="block">{task.label}</span>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                      {getCategoryLabel(task.category)}
                    </span>
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {task.age_min}-{task.age_max} ans
                    </span>
                  </div>
                </div>
                <div className="space-x-2 flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(task)}
                    aria-label="Modifier la tâche"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                    aria-label="Supprimer la tâche"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Points: {task.points_reward}</p>
              <p>Type: {task.is_daily ? 'Quotidienne' : 'Ponctuelle'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}