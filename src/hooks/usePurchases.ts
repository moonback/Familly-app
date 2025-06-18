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

interface ShopItem {
  id: string;
  name: string;
  price: number;
  user_id: string;
  created_at: string;
}

interface Purchase {
  id: string;
  child_id: string;
  item_id: string;
  purchased_at: string;
  item: ShopItem;
}

export function usePurchases(child: Child | null) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (child) {
      fetchPurchases();
    }
  }, [child]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          item:shop_items(*)
        `)
        .eq('child_id', child?.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des achats:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger l'historique des achats",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPurchaseStats = () => {
    const totalPurchases = purchases.length;
    const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.item?.price || 0), 0);
    const uniqueItems = new Set(purchases.map(p => p.item_id)).size;
    
    // Grouper par mois pour les statistiques
    const monthlyStats = purchases.reduce((acc, purchase) => {
      const date = new Date(purchase.purchased_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, total: 0 };
      }
      
      acc[monthKey].count += 1;
      acc[monthKey].total += purchase.item?.price || 0;
      
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return {
      totalPurchases,
      totalSpent,
      uniqueItems,
      monthlyStats
    };
  };

  return {
    purchases,
    loading,
    fetchPurchases,
    getPurchaseStats
  };
} 