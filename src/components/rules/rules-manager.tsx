import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { PlusCircleIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

interface Rule {
  id: string;
  label: string;
  points_penalty: number;
  created_at: string;
  user_id: string;
}

export function RulesManager() {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    points_penalty: '',
  });

  useEffect(() => {
    if (user) {
      fetchRules();
    }
  }, [user]);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de charger la liste des règles",
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
        description: "Vous devez être connecté pour ajouter une règle",
        variant: 'destructive',
      });
      return;
    }

    try {
      const ruleData = {
        label: formData.label,
        points_penalty: parseInt(formData.points_penalty),
        user_id: user.id,
      };

      if (editingRule) {
        const { error } = await supabase
          .from('rules')
          .update(ruleData)
          .eq('id', editingRule.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast({
          title: 'Succès',
          description: "La règle a été mise à jour avec succès",
        });
      } else {
        const { error } = await supabase
          .from('rules')
          .insert([ruleData]);

        if (error) throw error;
        toast({
          title: 'Succès',
          description: "La règle a été ajoutée avec succès",
        });
      }

      setIsDialogOpen(false);
      setEditingRule(null);
      setFormData({ label: '', points_penalty: '' });
      fetchRules();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      label: rule.label,
      points_penalty: rule.points_penalty.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: "Vous devez être connecté pour supprimer une règle",
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({
        title: 'Succès',
        description: "La règle a été supprimée avec succès",
      });
      fetchRules();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer la règle",
        variant: 'destructive',
      });
    }
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
        <h2 className="text-2xl font-bold">Gestion des Règles</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Ajouter une règle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Modifier une règle' : 'Ajouter une règle'}
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
                <Label htmlFor="points_penalty">Points de pénalité</Label>
                <Input
                  id="points_penalty"
                  type="number"
                  value={formData.points_penalty}
                  onChange={(e) => setFormData({ ...formData, points_penalty: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingRule ? 'Modifier' : 'Ajouter'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{rule.label}</span>
                <div className="space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(rule)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Points de pénalité: {rule.points_penalty}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 