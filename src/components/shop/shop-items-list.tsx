import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GiftIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Child, ShopItem } from '@/types';

interface PurchaseWithItem {
  id: string;
  item_id: string;
  purchased_at: string;
  shop_items: { name: string; price: number }[];
}

interface ShopItemsListProps {
  child: Child | null;
  onPointsUpdated: () => void;
}

export function ShopItemsList({ child, onPointsUpdated }: ShopItemsListProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (child) {
      fetchItems();
      fetchPurchases();
    }
  }, [child]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('user_id', child?.user_id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erreur', description: "Impossible de charger la boutique", variant: 'destructive' });
    }
    setItems(data || []);
    setLoading(false);
  };

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select('id, item_id, purchased_at, shop_items(name, price)')
      .eq('child_id', child?.id)
      .order('purchased_at', { ascending: false });
    if (!error) setPurchases(data || []);
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!child) return;
    if (child.points < item.price) {
      toast({ title: 'Erreur', description: 'Points insuffisants', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('purchases').insert([
      { child_id: child.id, item_id: item.id, purchased_at: new Date().toISOString() }
    ]);
    if (error) {
      toast({ title: 'Erreur', description: "Impossible d'acheter cet article", variant: 'destructive' });
      return;
    }

    const { error: updateError } = await supabase
      .from('children')
      .update({ points: child.points - item.price })
      .eq('id', child.id);
    if (!updateError) {
      toast({
        title: 'Achat réussi',
        description: `Vous avez acheté ${item.name}`
      });
      fetchPurchases();
      fetchItems();
      onPointsUpdated();
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-3xl font-bold text-gray-800">
            <GiftIcon className="h-7 w-7" /> Boutique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.price} points</p>
                </div>
                <Button onClick={() => handlePurchase(item)} disabled={!child || child.points < item.price}>
                  Acheter
                </Button>
              </div>
            ))}
            {items.length === 0 && <p className="text-center w-full">Aucun article disponible</p>}
          </div>
        </CardContent>
      </Card>

      {purchases.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Historique des achats</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {purchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="flex justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <span>{purchase.shop_items[0]?.name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(purchase.purchased_at).toLocaleDateString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
