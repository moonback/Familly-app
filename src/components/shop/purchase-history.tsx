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
  children: { name: string };
  shop_items: { name: string; price: number };
}

export function PurchaseHistory({ userId }: PurchaseHistoryProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`id, purchased_at, children(name), shop_items(name, price)`) 
      .in('child_id',
        (await supabase.from('children').select('id').eq('user_id', userId)).data?.map(c => c.id) || []
      )
      .order('purchased_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
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
                {item.children.name} - {item.shop_items.name}
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
