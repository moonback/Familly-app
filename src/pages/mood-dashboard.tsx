import { useAuth } from '@/context/auth-context';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface MoodEntry {
  id: string;
  child_id: string;
  mood: string;
  date: string;
  child: {
    name: string;
  };
}

export default function MoodDashboard() {
  const { user } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMoods();
    }
  }, [user]);

  const fetchMoods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('moods')
      .select('id, child_id, mood, date, children(name)')
      .eq('children.user_id', user?.id)
      .order('date', { ascending: true });
    if (!error && data) {
      setMoods(data as any);
    }
    setLoading(false);
  };

  const grouped = useMemo(() => {
    const map: Record<string, { name: string; data: Record<string, number> }> = {};
    moods.forEach((m) => {
      const child = m.child?.name || 'Inconnu';
      if (!map[child]) {
        map[child] = { name: child, data: {} };
      }
      map[child].data[m.mood] = (map[child].data[m.mood] || 0) + 1;
    });
    return Object.values(map);
  }, [moods]);

  return (
    <div className="p-4 space-y-6">
      {grouped.map((group) => (
        <Card key={group.name}>
          <CardHeader>
            <CardTitle>Humeurs de {group.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={Object.entries(group.data).map(([mood, value]) => ({ mood, value }))}
                >
                  <XAxis dataKey="mood" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
