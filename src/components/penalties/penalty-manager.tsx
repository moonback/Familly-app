import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, MinusCircle, History, Clock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';

interface Child {
  id: string;
  name: string;
  points: number;
  avatar_url: string;
}

interface Rule {
  id: string;
  label: string;
  points_penalty: number;
}

interface PenaltyHistory {
  id: string;
  child_id: string;
  points: number;
  reason: string;
  created_at: string;
  child: {
    name: string;
  };
}

export function PenaltyManager() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [penaltyHistory, setPenaltyHistory] = useState<PenaltyHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedRule, setSelectedRule] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Récupérer les enfants
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user?.id);

      if (childrenError) throw childrenError;

      // Récupérer les règles
      const { data: rulesData, error: rulesError } = await supabase
        .from('rules')
        .select('*')
        .eq('user_id', user?.id);

      if (rulesError) throw rulesError;

      // Récupérer l'historique des pénalités (uniquement les points négatifs et non les récompenses réclamées)
      const { data: historyData, error: historyError } = await supabase
        .from('points_history')
        .select(`
          *,
          child:children(name)
        `)
        .eq('user_id', user?.id)
        .lt('points', 0)
        .not('reason', 'ilike', 'Récompense réclamée%')
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      setChildren(childrenData || []);
      setRules(rulesData || []);
      setPenaltyHistory(historyData || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de charger les données",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPenalty = async () => {
    if (!selectedChild || !selectedRule) {
      toast({
        title: 'Erreur',
        description: "Veuillez sélectionner un enfant et une règle",
        variant: 'destructive',
      });
      return;
    }

    try {
      const selectedRuleData = rules.find(r => r.id === selectedRule);
      if (!selectedRuleData) throw new Error('Règle non trouvée');

      const selectedChildData = children.find(c => c.id === selectedChild);
      if (!selectedChildData) throw new Error('Enfant non trouvé');

      // Mettre à jour les points de l'enfant
      const { error: updateError } = await supabase
        .from('children')
        .update({ 
          points: selectedChildData.points - selectedRuleData.points_penalty 
        })
        .eq('id', selectedChild);

      if (updateError) throw updateError;

      // Enregistrer l'historique des points (uniquement pour les pénalités)
      const { error: historyError } = await supabase
        .from('points_history')
        .insert([{
          child_id: selectedChild,
          points: -selectedRuleData.points_penalty,
          reason: `Pénalité: ${selectedRuleData.label}`,
          user_id: user?.id
        }]);

      if (historyError) throw historyError;

      toast({
        title: 'Succès',
        description: "La pénalité a été appliquée avec succès",
      });

      setIsDialogOpen(false);
      setSelectedChild('');
      setSelectedRule('');
      fetchData();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'appliquer la pénalité",
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Pénalités</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <MinusCircle className="mr-2 h-4 w-4" />
              Appliquer une pénalité
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appliquer une pénalité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enfant</Label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enfant" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Règle violée</Label>
                <Select value={selectedRule} onValueChange={setSelectedRule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une règle" />
                  </SelectTrigger>
                  <SelectContent>
                    {rules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.label} (-{rule.points_penalty} points)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleApplyPenalty} className="w-full">
                Appliquer la pénalité
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{child.name}</span>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-bold">{child.points} points</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Cliquez sur "Appliquer une pénalité" pour retirer des points à cet enfant.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-red-500" />
            <CardTitle className="text-2xl font-bold">Historique des Pénalités</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {penaltyHistory.length > 0 ? (
            <div className="space-y-4">
              {penaltyHistory.map((penalty) => (
                <motion.div
                  key={penalty.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-full">
                      <MinusCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{penalty.child.name}</p>
                      <p className="text-sm text-gray-600">{penalty.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-500">-{Math.abs(penalty.points)} points</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(penalty.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-lg text-gray-600">Aucune pénalité n'a été appliquée</p>
              <p className="text-sm text-gray-500 mt-2">L'historique des pénalités apparaîtra ici</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 