import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ShopItemsOverviewProps {
  userId: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
}

export function ShopItemsOverview({ userId }: ShopItemsOverviewProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from('shop_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    };
    fetchItems();
  }, [userId]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (items.length === 0) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Articles disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="p-3 border rounded-lg">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <p className="text-sm text-gray-500">
                {item.price} points
                <span className="text-xs text-gray-400 ml-1">
                  ~{((item.price / 100).toFixed(2))} €
                </span>
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
