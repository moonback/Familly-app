import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PurchaseHistoryProps {
  userId: string;
}

interface HistoryItem {
  id: string;
  purchased_at: string;
  child: { name: string };
  shop_item: { name: string; price: number };
}

export function PurchaseHistory({ userId }: PurchaseHistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      // D'abord, récupérer les IDs des enfants de l'utilisateur
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id')
        .eq('user_id', userId);

      if (childrenError) {
        console.error('Erreur lors de la récupération des enfants:', childrenError);
        setLoading(false);
        return;
      }

      if (!childrenData || childrenData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const childIds = childrenData.map(child => child.id);

      // Ensuite, récupérer les achats avec les jointures
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          purchased_at,
          child:children(name),
          shop_item:shop_items(name, price)
        `)
        .in('child_id', childIds)
        .order('purchased_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erreur lors de la récupération des achats:', error);
        setItems([]);
      } else if (data) {
        // On doit transformer les données pour correspondre au type HistoryItem
        const itemsTransformés = data.map((item: any) => ({
          id: item.id,
          purchased_at: item.purchased_at,
          child: { name: item.child?.name ?? '' },
          shop_item: { name: item.shop_item?.name ?? '', price: item.shop_item?.price ?? 0 }
        }));
        setItems(itemsTransformés);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (items.length === 0) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Derniers achats</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
              <span>
                {item.child?.name} - {item.shop_item?.name}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(item.purchased_at).toLocaleDateString('fr-FR')}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
