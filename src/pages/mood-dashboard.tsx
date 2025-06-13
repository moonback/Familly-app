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
  children: {
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
    if (error) {
      console.error('Erreur lors du chargement des humeurs:', error);
      setMoods([]); // S'assurer que l'état est vide en cas d'erreur
    } else if (data) {
      console.log('Données d\'humeur récupérées:', data);
      setMoods(data as any);
    }
    setLoading(false);
  };

  const grouped = useMemo(() => {
    const map: Record<string, { name: string; data: Record<string, number> }> = {};
    moods.forEach((m) => {
      console.log('Traitement de l\'entrée d\'humeur:', m);
      const child = m.children?.name || 'Inconnu';
      console.log('Nom de l\'enfant (après traitement):', child);
      if (!map[child]) {
        map[child] = { name: child, data: {} };
      }
      map[child].data[m.mood] = (map[child].data[m.mood] || 0) + 1;
    });
    return Object.values(map);
  }, [moods]);

  return (
    <div className="p-4 space-y-6">
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : grouped.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="mb-4">Aucune humeur enregistrée</CardTitle>
          <CardContent>
            <p className="text-gray-600">Commencez par enregistrer l'humeur de vos enfants sur leur tableau de bord respectif.</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map((group) => (
          <Card key={group.name}>
            <CardHeader>
              <CardTitle>Humeurs de {group.name}</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
