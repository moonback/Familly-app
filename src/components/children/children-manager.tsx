import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Child } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { PlusCircleIcon, PencilIcon, TrashIcon, UserIcon, EyeIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Link } from 'react-router-dom';

export function ChildrenManager() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    avatar_url: '',
    custom_color: '',
  });

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de charger la liste des enfants",
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
        description: "Vous devez être connecté pour ajouter un enfant",
        variant: 'destructive',
      });
      return;
    }

    try {
      const childData = {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        avatar_url: formData.avatar_url || `https://images.pexels.com/photos/1820770/pexels-photo-1820770.jpeg?auto=compress&cs=tinysrgb&w=400`,
        custom_color: formData.custom_color || '#8B5CF6',
        user_id: user.id,
      };

      if (editingChild) {
        const { error } = await supabase
          .from('children')
          .update(childData)
          .eq('id', editingChild.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({
          title: 'Succès',
          description: "L'enfant a été mis à jour avec succès",
        });
      } else {
        const { data: newChild, error } = await supabase
          .from('children')
          .insert([childData])
          .select()
          .single();

        if (error) throw error;

        // Créer des tâches appropriées à l'âge pour le nouvel enfant
        if (newChild && newChild.age) {
          await createAgeAppropriateTasks(newChild.id, newChild.age);
        }

        toast({
          title: 'Succès',
          description: "L'enfant a été ajouté avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingChild(null);
      setFormData({ name: '', age: '', avatar_url: '', custom_color: '' });
      fetchChildren();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: 'destructive',
      });
    }
  };

  const createAgeAppropriateTasks = async (childId: string, age: number) => {
    try {
      // Récupérer les tâches appropriées à l'âge
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user?.id)
        .lte('age_min', age)
        .gte('age_max', age);

      if (error) throw error;

      if (tasks && tasks.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const childTasks = tasks.map(task => ({
          child_id: childId,
          task_id: task.id,
          due_date: today,
          is_completed: false
        }));

        const { error: insertError } = await supabase
          .from('child_tasks')
          .insert(childTasks);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Erreur lors de la création des tâches:', error);
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      age: child.age?.toString() || '',
      avatar_url: child.avatar_url || '',
      custom_color: child.custom_color || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: "Vous devez être connecté pour supprimer un enfant",
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({
        title: 'Succès',
        description: "L'enfant a été supprimé avec succès",
      });
      fetchChildren();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'enfant",
        variant: 'destructive',
      });
    }
  };

  const getRandomAvatarUrl = () => {
    const avatars = [
      'https://images.pexels.com/photos/1820770/pexels-photo-1820770.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=400'
    ];
    return avatars[Math.floor(Math.random() * avatars.length)];
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
        <h2 className="text-2xl font-bold">Gestion des Enfants</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Ajouter un enfant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChild ? 'Modifier un enfant' : 'Ajouter un enfant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Âge</Label>
                <Input
                  id="age"
                  type="number"
                  min="3"
                  max="18"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL de l'avatar</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="URL de l'image ou laissez vide pour un avatar aléatoire"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, avatar_url: getRandomAvatarUrl() })}
                  >
                    Aléatoire
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_color">Couleur personnalisée</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom_color"
                    type="color"
                    value={formData.custom_color || '#8B5CF6'}
                    onChange={(e) => setFormData({ ...formData, custom_color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.custom_color || '#8B5CF6'}
                    onChange={(e) => setFormData({ ...formData, custom_color: e.target.value })}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingChild ? 'Modifier' : 'Ajouter'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={child.avatar_url} alt={child.name} />
                    <AvatarFallback style={{ backgroundColor: child.custom_color }}>
                      {child.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="font-bold text-lg">{child.name}</span>
                    {child.age && (
                      <p className="text-sm text-gray-600">{child.age} ans</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Link to={`/dashboard/child/${child.id}`}>
                    <Button variant="ghost" size="icon" title="Voir le dashboard">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(child)}
                    title="Modifier"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(child.id)}
                    title="Supprimer"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: child.custom_color }}
                  />
                  <span className="text-sm text-gray-600">Couleur thème</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">{child.points}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {children.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enfant ajouté</h3>
          <p className="text-gray-600 mb-4">Commencez par ajouter un enfant pour utiliser l'application.</p>
        </div>
      )}
    </div>
  );
}