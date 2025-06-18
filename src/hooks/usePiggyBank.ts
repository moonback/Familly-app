import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar_url: string;
  custom_color: string;
  user_id: string;
  created_at: string;
}

interface PiggyBankTransaction {
  id: string;
  child_id: string;
  type: 'savings' | 'spending' | 'donation';
  points: number;
  created_at: string;
}

export function usePiggyBank(child: Child | null, fetchChildData: () => void) {
  const [transactions, setTransactions] = useState<PiggyBankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    if (child) {
      fetchTransactions();
    }
  }, [child]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('piggy_bank_transactions')
        .select('*')
        .eq('child_id', child?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger l'historique de la tirelire",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const depositPoints = async (amount: number) => {
    if (!child || depositing) return;

    if (amount <= 0 || amount > child.points) {
      toast({
        title: 'Montant invalide',
        description: "Le montant doit être positif et ne pas dépasser tes points disponibles",
        variant: 'destructive',
      });
      return;
    }

    setDepositing(true);

    try {
      // Insérer la transaction
      const { error: insertError } = await supabase
        .from('piggy_bank_transactions')
        .insert([{
          child_id: child.id,
          type: 'savings',
          points: amount,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      // Mettre à jour les points de l'enfant
      const { error: updateError } = await supabase
        .from('children')
        .update({ points: child.points - amount })
        .eq('id', child.id);

      if (updateError) throw updateError;

      toast({
        title: 'Dépôt réussi !',
        description: `${amount} points ajoutés à ta tirelire !`,
      });

      // Recharger les données
      fetchTransactions();
      fetchChildData();
      
      return true;
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'effectuer le dépôt",
        variant: 'destructive',
      });
      return false;
    } finally {
      setDepositing(false);
    }
  };

  const withdrawPoints = async (amount: number) => {
    if (!child || depositing) return;

    const stats = getPiggyBankStats();
    if (amount <= 0 || amount > stats.currentBalance) {
      toast({
        title: 'Montant invalide',
        description: "Le montant doit être positif et ne pas dépasser ton solde épargné",
        variant: 'destructive',
      });
      return;
    }

    setDepositing(true);

    try {
      // Créer une transaction de retrait (spending négatif)
      const { error: insertError } = await supabase
        .from('piggy_bank_transactions')
        .insert([{
          child_id: child.id,
          type: 'spending',
          points: amount,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      // Ajouter les points au portefeuille de l'enfant
      const { error: updateError } = await supabase
        .from('children')
        .update({ points: child.points + amount })
        .eq('id', child.id);

      if (updateError) throw updateError;

      toast({
        title: 'Retrait réussi !',
        description: `${amount} points retirés de ta tirelire !`,
      });

      // Recharger les données
      fetchTransactions();
      fetchChildData();
      
      return true;
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'effectuer le retrait",
        variant: 'destructive',
      });
      return false;
    } finally {
      setDepositing(false);
    }
  };

  const getPiggyBankStats = () => {
    const totalSavings = transactions
      .filter(t => t.type === 'savings')
      .reduce((sum, t) => sum + t.points, 0);
    
    const totalSpending = transactions
      .filter(t => t.type === 'spending')
      .reduce((sum, t) => sum + t.points, 0);
    
    const totalDonations = transactions
      .filter(t => t.type === 'donation')
      .reduce((sum, t) => sum + t.points, 0);
    
    const currentBalance = totalSavings - totalSpending - totalDonations;

    return {
      totalSavings,
      totalSpending,
      totalDonations,
      currentBalance,
      transactionCount: transactions.length
    };
  };

  return {
    transactions,
    loading,
    depositing,
    depositPoints,
    withdrawPoints,
    getPiggyBankStats,
    fetchTransactions
  };
} 