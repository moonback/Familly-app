import { useAuth } from '@/context/auth-context';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { NameType, Payload, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCwIcon, SmileIcon, InfoIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
      const child = m.children?.name || 'Inconnu';
      if (!map[child]) {
        map[child] = { name: child, data: {} };
      }
      map[child].data[m.mood] = (map[child].data[m.mood] || 0) + 1;
    });
    return Object.values(map);
  }, [moods]);

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'heureux': return '#84cc16'; // vert
      case 'triste': return '#60a5fa'; // bleu
      case 'en colère': return '#ef4444'; // rouge
      case 'fatigué': return '#f97316'; // orange
      case 'excité': return '#ec4899'; // rose
      default: return '#a3a3a3'; // gris
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2"
          >
            <SmileIcon className="h-10 w-10 text-yellow-500" />
            Tableau de Bord des Humeurs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-lg"
          >
            Visualisez l'évolution des humeurs de vos enfants au fil du temps.
          </motion.p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={fetchMoods}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          >
            <RefreshCwIcon className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </motion.div>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : grouped.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-md rounded-lg p-10 text-center shadow-xl border border-gray-200"
        >
          <InfoIcon className="h-16 w-16 text-blue-500 mx-auto mb-6" />
          <CardTitle className="mb-4 text-3xl font-bold text-gray-800">Aucune humeur enregistrée</CardTitle>
          <CardContent className="p-0">
            <p className="text-lg text-gray-600">Commencez par enregistrer l'humeur de vos enfants sur leur tableau de bord respectif pour voir les données ici.</p>
          </CardContent>
        </motion.div>
      ) : (
        grouped.map((group, index) => (
          <motion.div
            key={group.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-gray-200 rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5">
                <CardTitle className="text-2xl font-bold">Humeurs de {group.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={Object.entries(group.data).map(([mood, value]) => ({ mood, value }))}
                    margin={{
                      top: 20, right: 30, left: 20, bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="mood" axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                    <YAxis allowDecimals={false} stroke="#6b7280" />
                    <Tooltip cursor={{ fill: 'transparent' }}
                      formatter={(value: ValueType, name: NameType, props: Payload<ValueType, NameType>) => [`${value} fois`, props.payload.mood]}
                      labelFormatter={(label: any) => `Humeur: ${label}`}
                    />
                    <Bar dataKey="value" fill="#8884d8">
                      {Object.entries(group.data).map(([mood, value], idx) => (
                        <Bar key={mood} dataKey={mood} fill={getMoodColor(mood)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
