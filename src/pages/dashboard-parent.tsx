import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Users, 
  CheckSquare, 
  Shield, 
  Gift,
  ArrowLeft,
  Sparkles,
  Info,
  Loader2,
  RefreshCw,
  Calendar,
  ChevronDown,
  Brain,
  Flame,
  CheckCircle,
  Star
} from 'lucide-react';
import { ChildrenManager } from '@/components/children/children-manager';
import { TasksManager } from '@/components/tasks/tasks-manager';
import { RulesManager } from '@/components/rules/rules-manager';
import { RewardsManager } from '@/components/rewards/rewards-manager';
import { RiddlesManager } from '@/components/riddles/riddles-manager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type View = 'children' | 'tasks' | 'rules' | 'rewards' | 'riddles' | null;
type Period = 'day' | 'week' | 'month';

interface DashboardStats {
  activeChildren: number;
  completedTasks: number;
  availableRewards: number;
  totalPoints: number;
  averageCompletion: number;
  isLoading: boolean;
  history: {
    date: string;
    tasks: number;
    rewards: number;
    points: number;
  }[];
  childrenStats: {
    id: string;
    name: string;
    points: number;
    completedTasks: number;
    pendingTasks: number;
    avatar_url: string;
    streak: number;
    lastActivity: string;
  }[];
  recentActivities: {
    type: 'task' | 'reward' | 'points';
    childName: string;
    description: string;
    timestamp: string;
    points?: number;
  }[];
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isLoading: boolean;
  details?: {
    label: string;
    value: number;
  }[];
}

const StatCard = ({ title, value, icon, color, isLoading, details }: StatCardProps) => (
  <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-300">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          {isLoading ? (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Chargement...</span>
            </div>
          ) : (
            <motion.h3 
              className="text-2xl font-semibold text-gray-800 mt-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {value}
            </motion.h3>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardParent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>(null);
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<DashboardStats>({
    activeChildren: 0,
    completedTasks: 0,
    availableRewards: 0,
    totalPoints: 0,
    averageCompletion: 0,
    isLoading: true,
    history: [],
    childrenStats: [],
    recentActivities: []
  });

  const fetchStats = async () => {
    if (!user) return;

    setStats(prev => ({ ...prev, isLoading: true }));

    try {
      const startDate = period === 'day' 
        ? startOfDay(subDays(new Date(), 1))
        : period === 'week'
          ? startOfDay(subWeeks(new Date(), 1))
          : startOfDay(subMonths(new Date(), 1));

      const endDate = endOfDay(new Date());

      // Récupérer les statistiques des enfants
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          id,
          name,
          points,
          avatar_url,
          child_tasks (
            id,
            is_completed,
            completed_at
          )
        `)
        .eq('user_id', user.id);

      if (childrenError) throw childrenError;

      const childrenStats = childrenData?.map(child => ({
        id: child.id,
        name: child.name,
        points: child.points,
        completedTasks: child.child_tasks?.filter(t => t.is_completed).length || 0,
        pendingTasks: child.child_tasks?.filter(t => !t.is_completed).length || 0,
        avatar_url: child.avatar_url
      })) || [];

      // Calculer les streaks et dernières activités
      const childrenStatsWithStreak = await Promise.all(childrenStats.map(async (child) => {
        // Récupérer les tâches complétées des 7 derniers jours
        const { data: recentTasks } = await supabase
          .from('child_tasks')
          .select('completed_at')
          .eq('child_id', child.id)
          .eq('is_completed', true)
          .gte('completed_at', subDays(new Date(), 7).toISOString())
          .order('completed_at', { ascending: false });

        // Calculer le streak
        let streak = 0;
        let currentDate = new Date();
        const completedDates = new Set(recentTasks?.map(t => format(new Date(t.completed_at), 'yyyy-MM-dd')) || []);

        while (completedDates.has(format(currentDate, 'yyyy-MM-dd'))) {
          streak++;
          currentDate = subDays(currentDate, 1);
        }

        // Récupérer la dernière activité
        const { data: lastActivity } = await supabase
          .from('child_tasks')
          .select('completed_at')
          .eq('child_id', child.id)
          .eq('is_completed', true)
          .order('completed_at', { ascending: false })
          .limit(1);

        return {
          ...child,
          streak,
          lastActivity: lastActivity?.[0]?.completed_at || null
        };
      }));

      // Calculer les statistiques globales
      const totalPoints = childrenStatsWithStreak.reduce((sum, child) => sum + child.points, 0);
      const totalCompletedTasks = childrenStatsWithStreak.reduce((sum, child) => sum + child.completedTasks, 0);
      const totalPendingTasks = childrenStatsWithStreak.reduce((sum, child) => sum + child.pendingTasks, 0);
      const averageCompletion = totalPendingTasks > 0 
        ? Math.round((totalCompletedTasks / (totalCompletedTasks + totalPendingTasks)) * 100)
        : 100;

      // Récupérer l'historique des tâches complétées
      const { data: tasksHistory } = await supabase
        .from('child_tasks')
        .select(`
          completed_at,
          is_completed,
          child_id,
          children (
            user_id
          )
        `)
        .eq('is_completed', true)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .in('child_id', childrenStatsWithStreak.map(child => child.id));

      // Récupérer l'historique des récompenses réclamées
      const { data: rewardsHistory } = await supabase
        .from('child_rewards_claimed')
        .select(`
          claimed_at,
          child_id,
          children (
            user_id
          )
        `)
        .gte('claimed_at', startDate.toISOString())
        .lte('claimed_at', endDate.toISOString())
        .in('child_id', childrenStatsWithStreak.map(child => child.id));

      // Récupérer l'historique des points
      const { data: pointsHistory } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Récupérer le nombre de récompenses disponibles
      const { count: availableRewardsCount } = await supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Traiter les données historiques
      const history = processHistoryData(
        tasksHistory || [], 
        rewardsHistory || [], 
        pointsHistory || [],
        period
      );

      // Récupérer les activités récentes
      const { data: recentActivities } = await supabase
        .from('points_history')
        .select(`
          *,
          children (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedActivities = recentActivities?.map(activity => ({
        type: 'points' as const,
        childName: activity.children.name,
        description: activity.reason,
        timestamp: activity.created_at,
        points: activity.points
      })) || [];

      setStats({
        activeChildren: childrenStatsWithStreak.length,
        completedTasks: totalCompletedTasks,
        availableRewards: availableRewardsCount || 0,
        totalPoints,
        averageCompletion,
        isLoading: false,
        history,
        childrenStats: childrenStatsWithStreak,
        recentActivities: formattedActivities
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const processHistoryData = (tasksData: any[], rewardsData: any[], pointsData: any[], period: Period) => {
    const groupedData = new Map<string, { tasks: number; rewards: number; points: number }>();

    // Traiter les tâches
    tasksData.forEach(item => {
      const date = format(new Date(item.completed_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { tasks: 0, rewards: 0, points: 0 });
      }
      const current = groupedData.get(date)!;
      current.tasks += 1;
    });

    // Traiter les récompenses
    rewardsData.forEach(item => {
      const date = format(new Date(item.claimed_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { tasks: 0, rewards: 0, points: 0 });
      }
      const current = groupedData.get(date)!;
      current.rewards += 1;
    });

    // Traiter les points
    pointsData.forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { tasks: 0, rewards: 0, points: 0 });
      }
      const current = groupedData.get(date)!;
      current.points += item.points;
    });

    // Remplir les dates manquantes avec des zéros
    const startDate = period === 'day' 
      ? startOfDay(subDays(new Date(), 1))
      : period === 'week'
        ? startOfDay(subWeeks(new Date(), 1))
        : startOfDay(subMonths(new Date(), 1));

    const endDate = endOfDay(new Date());
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (!groupedData.has(dateStr)) {
        groupedData.set(dateStr, { tasks: 0, rewards: 0, points: 0 });
      }
      currentDate = addDays(currentDate, 1);
    }

    return Array.from(groupedData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: format(new Date(date), 'dd MMM', { locale: fr }),
        ...values
      }));
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchStats();
  }, [user, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-indigo-700 font-medium">Chargement du tableau de bord parent...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const dashboardCards = [
    {
      id: 'children',
      title: 'Gérer les Enfants',
      description: 'Ajoutez, modifiez ou supprimez les profils de vos enfants.',
      icon: Users,
      color: 'from-pink-500 to-rose-600',
      hoverColor: 'hover:from-pink-600 hover:to-rose-700',
      bgGradient: 'bg-gradient-to-br from-pink-50 to-rose-100',
      borderColor: 'border-pink-200',
      buttonText: 'Gérer les Enfants'
    },
    {
      id: 'tasks',
      title: 'Gérer les Tâches',
      description: 'Définissez les tâches quotidiennes et leurs points de récompense.',
      icon: CheckSquare,
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700',
      bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
      buttonText: 'Gérer les Tâches'
    },
    {
      id: 'rules',
      title: 'Gérer les Règles',
      description: 'Établissez les règles de comportement et les pénalités de points.',
      icon: Shield,
      color: 'from-orange-500 to-amber-600',
      hoverColor: 'hover:from-orange-600 hover:to-amber-700',
      bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-100',
      borderColor: 'border-orange-200',
      buttonText: 'Gérer les Règles'
    },
    {
      id: 'rewards',
      title: 'Gérer les Récompenses',
      description: 'Créez des récompenses que vos enfants pourront échanger avec leurs points.',
      icon: Gift,
      color: 'from-purple-500 to-violet-600',
      hoverColor: 'hover:from-purple-600 hover:to-violet-700',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-violet-100',
      borderColor: 'border-purple-200',
      buttonText: 'Gérer les Récompenses'
    },
    {
      id: 'riddles',
      title: 'Gérer les Devinettes',
      description: 'Créez des devinettes quotidiennes pour que vos enfants gagnent des points bonus.',
      icon: Brain,
      color: 'from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      borderColor: 'border-blue-200',
      buttonText: 'Gérer les Devinettes'
    }
  ];

  const renderStats = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <motion.h3 
          className="text-xl font-bold text-gray-900"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Statistiques
        </motion.h3>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
            <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm border-2">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={fetchStats}
              className="hover:bg-white/80 backdrop-blur-sm border-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enfants Actifs"
          value={stats.activeChildren}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="blue"
          isLoading={stats.isLoading}
        />
        <StatCard
          title="Tâches Complétées"
          value={stats.completedTasks}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          color="green"
          isLoading={stats.isLoading}
        />
        <StatCard
          title="Récompenses Attribuées"
          value={stats.availableRewards}
          icon={<Gift className="h-5 w-5 text-purple-600" />}
          color="purple"
          isLoading={stats.isLoading}
        />
        <StatCard
          title="Points Totaux"
          value={stats.totalPoints}
          icon={<Star className="h-5 w-5 text-yellow-600" />}
          color="yellow"
          isLoading={stats.isLoading}
        />
      </div>

      {/* Activités récentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className={`p-2 rounded-full bg-${activity.type === 'task' ? 'green' : activity.type === 'reward' ? 'purple' : 'yellow'}-50`}>
                    {activity.type === 'task' ? <CheckSquare className="h-5 w-5 text-green-600" /> :
                     activity.type === 'reward' ? <Gift className="h-5 w-5 text-purple-600" /> :
                     <Sparkles className="h-5 w-5 text-yellow-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tableau des performances des enfants avec streaks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Performance des enfants</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Enfant</th>
                    <th className="text-center py-3 px-4">Points</th>
                    <th className="text-center py-3 px-4">Streak</th>
                    <th className="text-center py-3 px-4">Tâches complétées</th>
                    <th className="text-center py-3 px-4">Tâches en attente</th>
                    <th className="text-center py-3 px-4">Dernière activité</th>
                    <th className="text-center py-3 px-4">Progression</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.childrenStats.map((child) => (
                    <tr key={child.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={child.avatar_url} />
                            <AvatarFallback>{child.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{child.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="font-bold text-yellow-600">{child.points}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-orange-600">{child.streak}</span>
                          <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-green-600">{child.completedTasks}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-orange-600">{child.pendingTasks}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {child.lastActivity ? format(new Date(child.lastActivity), 'dd MMM HH:mm', { locale: fr }) : 'Jamais'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{
                              width: `${(child.completedTasks / (child.completedTasks + child.pendingTasks)) * 100}%`
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Graphique d'évolution amélioré */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 shadow-xl">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Évolution des activités</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.history}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tasks" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTasks)" 
                    name="Tâches"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rewards" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRewards)" 
                    name="Récompenses"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="points" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPoints)" 
                    name="Points"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  const renderContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView || 'dashboard'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {currentView ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-gray-200"
            >
              {renderCurrentView()}
            </motion.div>
          ) : (
            <>
              {/* Hero Section avec animation améliorée */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl text-white shadow-2xl relative overflow-hidden"
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                  animate={{ 
                    x: ['0%', '100%'],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                <div className="relative z-10">
                  <motion.div 
                    className="flex justify-center mb-6"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-16 w-16 text-yellow-300" />
                  </motion.div>
                  <motion.h2 
                    className="text-4xl md:text-5xl font-bold mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Bienvenue dans votre espace parent
                  </motion.h2>
                  <motion.p 
                    className="text-xl opacity-90 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Gérez facilement les activités, règles et récompenses de vos enfants
                  </motion.p>
                </div>
              </motion.div>

              {/* Dashboard Cards avec animations et tooltips améliorés */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <TooltipProvider>
                  {dashboardCards.map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Card 
                                className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${card.borderColor} ${card.bgGradient} overflow-hidden relative`}
                                onClick={() => setCurrentView(card.id as View)}
                              >
                                <motion.div 
                                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100"
                                  whileHover={{ scale: 1.02 }}
                                  transition={{ duration: 0.2 }}
                                />
                                
                                <CardHeader className="text-center pb-4 relative z-10">
                                  <motion.div 
                                    className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-r ${card.color} ${card.hoverColor} flex items-center justify-center mb-4 shadow-lg`}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                  >
                                    <IconComponent className="h-10 w-10 text-white" />
                                  </motion.div>
                                  <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                                    {card.title}
                                  </CardTitle>
                                </CardHeader>
                                
                                <CardContent className="text-center relative z-10">
                                  <p className="text-gray-600 mb-6 leading-relaxed">
                                    {card.description}
                                  </p>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button 
                                      className={`w-full bg-gradient-to-r ${card.color} ${card.hoverColor} text-white border-0 shadow-lg font-semibold py-3 transition-all duration-300 group-hover:shadow-xl`}
                                    >
                                      <Plus className="mr-2 h-5 w-5" />
                                      {card.buttonText}
                                    </Button>
                                  </motion.div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="bottom" 
                            className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-xl"
                          >
                            <p className="text-sm font-medium">Cliquez pour accéder à {card.title.toLowerCase()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </motion.div>
                    );
                  })}
                </TooltipProvider>
              </div>

              {/* Section de statistiques avec données réelles */}
              {renderStats()}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'children':
        return <ChildrenManager />;
      case 'tasks':
        return <TasksManager />;
      case 'rules':
        return <RulesManager />;
      case 'rewards':
        return <RewardsManager />;
      case 'riddles':
        return <RiddlesManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header avec animation améliorée */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            {currentView && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView(null)}
                  className="flex items-center gap-2 hover:bg-white/80 transition-colors border-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </motion.div>
            )}
            <div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {currentView ? 
                  dashboardCards.find(card => card.id === currentView)?.title || 'Tableau de bord Parent' :
                  'Tableau de bord Parent'
                }
              </motion.h1>
              {!currentView && (
                <motion.p 
                  className="text-gray-600 mt-2 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Gérez votre famille avec style et simplicité
                </motion.p>
              )}
            </div>
          </div>
          
          {!currentView && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border-2 border-gray-200"
            >
              <motion.div 
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity
                }}
              />
              <span className="text-sm font-medium text-gray-700">En ligne</span>
            </motion.div>
          )}
        </motion.div>

        {/* Content */}
        <div className="relative">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}