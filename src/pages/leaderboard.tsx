import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { fetchLeaderboard, LeaderboardEntry } from '@/lib/supabase';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard(period);
      setEntries(data);
    } catch (err) {
      console.error('Erreur chargement leaderboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/parent')}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl max-w-xl mx-auto">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <CardTitle className="text-2xl font-bold">Leaderboard</CardTitle>
          </div>
          <Select value={period} onValueChange={value => setPeriod(value as 'day' | 'week' | 'month')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-sm text-gray-500">Chargement...</p>
          ) : entries.length > 0 ? (
            <ul className="space-y-4">
              {entries.map((entry, idx) => (
                <li key={entry.child_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-purple-200">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-purple-500 text-white font-bold">
                        {entry.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-800">
                      {idx + 1}. {entry.name}
                    </span>
                  </div>
                  <span className="font-bold text-purple-600">{entry.points} pts</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">Aucun résultat</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

