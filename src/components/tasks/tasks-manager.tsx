import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { PlusCircleIcon, PencilIcon, TrashIcon, SparklesIcon, StarIcon, UsersIcon, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { generateTaskSuggestions } from '@/lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';

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

interface TaskSuggestion {
  label: string;
  points_reward: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
  age_min: number;
  age_max: number;
  is_daily: boolean;
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
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

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

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      console.log('🤖 Chargement des suggestions IA...');
      
      // Vérifier si la clé API est disponible
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Clé API Gemini manquante. Vérifiez votre fichier .env');
      }

      const data = await generateTaskSuggestions();
      console.log('✅ Suggestions générées:', data);
      
      if (!data || data.length === 0) {
        throw new Error('Aucune suggestion générée');
      }

      setSuggestions(data);
      setSuggestionsOpen(true);
      
      toast({
        title: 'Succès',
        description: `${data.length} suggestions générées avec succès !`,
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des suggestions:', error);
      
      let errorMessage = "Impossible de récupérer les suggestions";
      
      if (error instanceof Error) {
        if (error.message.includes('Clé API')) {
          errorMessage = "Clé API Gemini manquante. Contactez l'administrateur.";
        } else if (error.message.includes('Format de réponse')) {
          errorMessage = "Erreur de format dans la réponse de l'IA. Réessayez.";
        } else if (error.message.includes('Gemini API error')) {
          errorMessage = "Erreur de l'API Gemini. Vérifiez votre connexion.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleAddSuggestion = async (suggestion: TaskSuggestion) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: "Vous devez être connecté pour ajouter une tâche",
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🔄 Ajout de la suggestion:', suggestion);
      
      const taskData = {
        label: suggestion.label,
        points_reward: suggestion.points_reward,
        is_daily: suggestion.is_daily,
        age_min: suggestion.age_min,
        age_max: suggestion.age_max,
        category: suggestion.category,
        user_id: user.id,
      };

      console.log('📝 Données de la tâche à insérer:', taskData);

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Tâche ajoutée avec succès:', data);

      // Créer les tâches pour les enfants éligibles
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('id, age')
        .eq('user_id', user.id)
        .gte('age', taskData.age_min)
        .lte('age', taskData.age_max);

      if (childrenError) {
        console.error('❌ Erreur lors de la récupération des enfants:', childrenError);
      } else if (children && children.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const childTasks = children.map(child => ({
          child_id: child.id,
          task_id: data.id,
          due_date: today,
          is_completed: false
        }));

        const { error: childTasksError } = await supabase
          .from('child_tasks')
          .insert(childTasks);

        if (childTasksError) {
          console.error('❌ Erreur lors de la création des child_tasks:', childTasksError);
        } else {
          console.log('✅ Child tasks créées pour', children.length, 'enfants');
        }
      }

      toast({
        title: 'Succès',
        description: 'Tâche ajoutée depuis les suggestions',
      });
      
      // Fermer la modal des suggestions et rafraîchir la liste
      setSuggestionsOpen(false);
      fetchTasks();
      
    } catch (error) {
      console.error('❌ Erreur complète lors de l\'ajout de la suggestion:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter la tâche. Vérifiez la console pour plus de détails.",
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
      quotidien: 'bg-blue-100 text-blue-800 border-blue-200',
      scolaire: 'bg-green-100 text-green-800 border-green-200',
      maison: 'bg-orange-100 text-orange-800 border-orange-200',
      personnel: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={loadSuggestions}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
          >
            <SparklesIcon className="mr-2 h-4 w-4" />
            Suggestions IA
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  {editingTask ? 'Modifier' : 'Ajouter'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-purple-500" />
              Suggestions IA - Tâches
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {suggestionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Génération des suggestions en cours...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(suggestion.category)}</span>
                        <Badge className={getCategoryColor(suggestion.category)}>
                          {getCategoryLabel(suggestion.category)}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <PlusCircleIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{suggestion.label}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span>{suggestion.points_reward} points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        <span>{suggestion.age_min}-{suggestion.age_max} ans</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{suggestion.is_daily ? 'Quotidienne' : 'Ponctuelle'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                        <Badge className={getCategoryColor(task.category)}>
                          {getCategoryLabel(task.category)}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.label}</h3>
                    </div>
                    <div className="space-x-1 flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(task)}
                        className="h-8 w-8 hover:bg-purple-50"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">{task.points_reward} points</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{task.age_min}-{task.age_max} ans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{task.is_daily ? 'Quotidienne' : 'Ponctuelle'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}