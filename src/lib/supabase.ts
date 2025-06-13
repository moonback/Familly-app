import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { startOfDay, subDays, subWeeks, subMonths } from 'date-fns';

export interface LeaderboardEntry {
  child_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
}

export async function fetchLeaderboard(period: 'day' | 'week' | 'month'): Promise<LeaderboardEntry[]> {
  const endDate = new Date();
  const startDate =
    period === 'day'
      ? subDays(endDate, 1)
      : period === 'week'
        ? subWeeks(endDate, 1)
        : subMonths(endDate, 1);

  const { data, error } = await supabase
    .from('child_points_daily')
    .select('child_id,name,avatar_url,points,day')
    .gte('day', startOfDay(startDate).toISOString())
    .lte('day', endDate.toISOString());

  if (error) {
    throw error;
  }

  const aggregated: Record<string, LeaderboardEntry> = {};
  (data || []).forEach((row) => {
    if (!aggregated[row.child_id]) {
      aggregated[row.child_id] = {
        child_id: row.child_id,
        name: row.name,
        avatar_url: row.avatar_url,
        points: 0,
      };
    }
    aggregated[row.child_id].points += row.points as number;
  });

  return Object.values(aggregated).sort((a, b) => b.points - a.points);
}
