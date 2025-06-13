import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GiftIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Child, ShopItem } from '@/types';
import { motion } from 'framer-motion';

interface PurchaseWithItem {
  id: string;
  item_id: string;
  purchased_at: string;
  shop_items: { name: string; price: number }[];
}

interface ShopItemsListProps {
  child: Child | null;
  onPointsUpdated: () => void;
  className?: string;
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
      <Card className="bg-white/90 backdrop-blur-md shadow-xl border-0 rounded-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-10 group-hover:opacity-15 transition-opacity duration-300" />
        <CardHeader className="relative z-10 p-6 bg-white/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-3 text-3xl font-bold text-gray-800">
            <GiftIcon className="h-8 w-8 text-purple-600 drop-shadow-xl" /> Boutique
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
                className="p-6 border-2 border-purple-200 rounded-xl flex flex-col items-center text-center space-y-4 bg-white shadow-md"
              >
                <GiftIcon className="h-12 w-12 text-purple-500 mb-2" />
                <div>
                  <h4 className="font-bold text-xl text-gray-900 mb-1">{item.name}</h4>
                  <p className="text-lg text-purple-600 font-semibold">
                    {item.price} points
                    <span className="text-xs text-gray-400 ml-1">
                      ~{((item.price / 100).toFixed(2))} €
                    </span>
                  </p>
                </div>
                <Button 
                  onClick={() => handlePurchase(item)}
                  disabled={!child || child.points < item.price}
                  className={`w-full py-3 text-lg rounded-lg shadow-lg ${
                    (child?.points || 0) >= item.price
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  } transition-all duration-300`}
                >
                  Acheter
                </Button>
              </motion.div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 col-span-full">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-xl text-gray-600">La boutique est vide !</p>
                <p className="text-base text-gray-500 mt-2">Demandez à vos parents d'ajouter des articles.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {purchases.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-md shadow-xl border-0 rounded-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-10 group-hover:opacity-15 transition-opacity duration-300" />
          <CardHeader className="relative z-10 p-6 bg-white/50 backdrop-blur-sm">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <GiftIcon className="h-7 w-7 text-green-600" /> Historique des achats
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 p-6">
            <ul className="space-y-4">
              {purchases.map((purchase, index) => (
                <motion.li
                  key={purchase.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm"
                >
                  <span className="font-medium text-gray-800">{purchase.shop_items[0]?.name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(purchase.purchased_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
