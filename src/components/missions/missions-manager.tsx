import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PencilIcon, TrashIcon, PlusCircleIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface Mission {
  id: string;
  title: string;
  description: string | null;
  category: string;
  user_id: string;
}

export function MissionsManager() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: '',
    category: 'divers'
  });

  useEffect(() => {
    if (user) {
      fetchMissions();
    }
  }, [user]);

  const fetchMissions = async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: "Impossible de charger les missions", variant: 'destructive' });
    } else {
      setMissions(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const missionData = {
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      user_id: user.id
    };

    try {
      if (editingMission) {
        const { error } = await supabase
          .from('missions')
          .update(missionData)
          .eq('id', editingMission.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('missions')
          .insert([missionData])
          .select()
          .single();
        if (error) throw error;
        const missionId = data.id;
        const steps = formData.steps.split('\n').filter(s => s.trim() !== '');
        for (let i = 0; i < steps.length; i++) {
          await supabase.from('mission_steps').insert([
            { mission_id: missionId, label: steps[i], step_order: i + 1 }
          ]);
        }
      }

      toast({ title: 'Succès', description: 'Mission enregistrée' });
      setIsDialogOpen(false);
      setEditingMission(null);
      setFormData({ title: '', description: '', steps: '', category: 'divers' });
      fetchMissions();
    } catch (err) {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer la mission", variant: 'destructive' });
    }
  };

  const handleEdit = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({ title: mission.title, description: mission.description || '', steps: '', category: mission.category });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await supabase.from('mission_steps').delete().eq('mission_id', id);
    await supabase.from('missions').delete().eq('id', id).eq('user_id', user.id);
    fetchMissions();
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Ajouter une mission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMission ? 'Modifier une mission' : 'Ajouter une mission'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">Étapes (une par ligne)</Label>
                <Textarea id="steps" value={formData.steps} onChange={e => setFormData({ ...formData, steps: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">
                {editingMission ? 'Modifier' : 'Ajouter'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missions.map(mission => (
          <Card key={mission.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{mission.title}</span>
                <div className="space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(mission)} aria-label="Modifier la mission">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(mission.id)} aria-label="Supprimer la mission">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{mission.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
