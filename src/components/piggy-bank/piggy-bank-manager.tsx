import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PiggyBankIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Child, PiggyBankTransaction } from '@/types';

interface PiggyBankManagerProps {
  child: Child | null;
  onPointsUpdated: () => void;
}

export function PiggyBankManager({ child, onPointsUpdated }: PiggyBankManagerProps) {
  const [transactions, setTransactions] = useState<PiggyBankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ type: 'savings' as 'savings' | 'spending' | 'donation', points: '' });

  useEffect(() => {
    if (child) {
      fetchTransactions();
    }
  }, [child]);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('piggy_bank_transactions')
      .select('*')
      .eq('child_id', child?.id)
      .order('created_at', { ascending: false });
    if (!error) setTransactions(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;
    const pointsValue = parseInt(formData.points);
    if (isNaN(pointsValue) || pointsValue <= 0) return;

    const { error } = await supabase.from('piggy_bank_transactions').insert([
      { child_id: child.id, type: formData.type, points: pointsValue, created_at: new Date().toISOString() }
    ]);

    if (error) {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer la transaction", variant: 'destructive' });
      return;
    }

    const newPoints = formData.type === 'savings' ? child.points + pointsValue : child.points - pointsValue;
    const { error: updateError } = await supabase
      .from('children')
      .update({ points: newPoints })
      .eq('id', child.id);

    if (updateError) {
      toast({ title: 'Erreur', description: "Impossible de mettre à jour les points", variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Transaction ajoutée' });
      setFormData({ type: 'savings', points: '' });
      fetchTransactions();
      onPointsUpdated();
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-3xl font-bold text-gray-800">
          <PiggyBankIcon className="h-7 w-7" /> Tirelire
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'savings' | 'spending' | 'donation' })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savings">Épargne</SelectItem>
              <SelectItem value="spending">Dépense</SelectItem>
              <SelectItem value="donation">Don</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Points" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} />
          <Button type="submit">Ajouter</Button>
        </form>
        <ul className="space-y-2">
          {transactions.map((t) => (
            <li key={t.id} className="flex justify-between border-b pb-1 last:border-b-0">
              <span>{t.type}</span>
              <span>{t.points} pts</span>
              <span className="text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
            </li>
          ))}
          {transactions.length === 0 && <p className="text-center">Aucune transaction</p>}
        </ul>
      </CardContent>
    </Card>
  );
}
