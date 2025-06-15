import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface ChildBadge {
  id: string;
  badge: {
    id: string;
    title: string;
    icon_url: string | null;
  };
}

export function BadgeGallery({ childId }: { childId: string }) {
  const [badges, setBadges] = useState<ChildBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [childId]);

  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from('child_badges')
      .select('id, badge:badges(id,title,icon_url)')
      .eq('child_id', childId);

    if (!error) {
      setBadges(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  return (
    <Card className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-4 flex items-center gap-2">
          Galerie de badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {badges.map(({ id, badge }) => (
            <motion.div key={id} whileHover={{ scale: 1.1 }} className="flex flex-col items-center">
              {badge.icon_url && (
                <img src={badge.icon_url} alt={badge.title} className="w-16 h-16 rounded-full" />
              )}
              <span className="text-sm mt-1 text-center">{badge.title}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
