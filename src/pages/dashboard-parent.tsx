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
  RefreshCw,
  Calendar,
  ChevronDown,
  Brain,
  Flame,
  CheckCircle,
  Star,
  Trophy,
  TrendingUp,
  Clock,
  Zap,
  Heart,
  PiggyBankIcon,
  Minus
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseHistory } from '@/components/shop/purchase-history';
import { ShopItemsOverview } from '@/components/shop/shop-items-overview';
import { ShopManager } from '@/components/shop/shop-manager';

type View = 'children' | 'tasks' | 'rules' | 'rewards' | 'riddles' | 'shop' | null;
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
    savings?: number;
    spending?: number;
    donation?: number;
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
  trend?: number;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, isLoading, details, trend, subtitle }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
  >
    <Card className="bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500 border-0 rounded-2xl overflow-hidden group relative">
      {/* Gradient border effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {trend !== undefined && (
                <motion.div 
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    trend > 0 ? 'bg-green-100 text-green-700' : 
                    trend < 0 ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <TrendingUp className={`h-3 w-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(trend)}%
                </motion.div>
              )}
            </div>
            
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div>
                <motion.h3 
                  className="text-3xl font-bold text-gray-800 mb-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {value.toLocaleString()}
                </motion.h3>
                {subtitle && (
                  <p className="text-xs text-gray-500">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          
          <motion.div 
            className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {icon}
          </motion.div>
        </div>
        
        {details && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-xs">
              {details.map((detail, index) => (
                <div key={index} className="text-center">
                  <div className="font-semibold text-gray-800">{detail.value}</div>
                  <div className="text-gray-500">{detail.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
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

      const { data: piggyHistory } = await supabase
        .from('piggy_bank_transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('child_id', childrenStatsWithStreak.map(child => child.id));

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
        piggyHistory || [],
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

  const processHistoryData = (
    tasksData: any[],
    rewardsData: any[],
    pointsData: any[],
    piggyData: any[],
    period: Period
  ) => {
    const groupedData = new Map<string, { tasks: number; rewards: number; points: number; savings: number; spending: number; donation: number }>();

    // Traiter les tâches
    tasksData.forEach(item => {
      const date = format(new Date(item.completed_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { tasks: 0, rewards: 0, points: 0, savings: 0, spending: 0, donation: 0 });
      }
      const current = groupedData.get(date)!;
      current.tasks += 1;
    });

    // Traiter les récompenses
    rewardsData.forEach(item => {
      const date = format(new Date(item.claimed_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { tasks: 0, rewards: 0, points: 0, savings: 0, spending: 0, donation: 0 });
      }
      const current = groupedData.get(date)!;
      current.rewards += 1;
    });

    // Traiter les points
    pointsData.forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { tasks: 0, rewards: 0, points: 0, savings: 0, spending: 0, donation: 0 });
      }
      const current = groupedData.get(date)!;
      current.points += item.points;
    });

    piggyData.forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { tasks: 0, rewards: 0, points: 0, savings: 0, spending: 0, donation: 0 });
      }
      const current = groupedData.get(date)!;
      if (item.type === 'savings') current.savings += item.points;
      if (item.type === 'spending') current.spending += item.points;
      if (item.type === 'donation') current.donation += item.points;
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
        groupedData.set(dateStr, { tasks: 0, rewards: 0, points: 0, savings: 0, spending: 0, donation: 0 });
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

  if (loading || stats.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
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
      color: 'from-pink-500 to-rose-500',
      hoverColor: 'hover:from-pink-600 hover:to-rose-600',
      bgGradient: 'bg-gradient-to-br from-pink-50 to-rose-100',
      borderColor: 'border-pink-200',
      buttonText: 'Gérer les Enfants',
      accent: 'bg-pink-500'
    },
    {
      id: 'tasks',
      title: 'Gérer les Tâches',
      description: 'Définissez les tâches quotidiennes et leurs points de récompense.',
      icon: CheckSquare,
      color: 'from-emerald-500 to-teal-500',
      hoverColor: 'hover:from-emerald-600 hover:to-teal-600',
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-teal-100',
      borderColor: 'border-emerald-200',
      buttonText: 'Gérer les Tâches',
      accent: 'bg-emerald-500'
    },
    {
      id: 'rules',
      title: 'Gérer les Règles',
      description: 'Établissez les règles de comportement et les pénalités de points.',
      icon: Shield,
      color: 'from-amber-500 to-orange-500',
      hoverColor: 'hover:from-amber-600 hover:to-orange-600',
      bgGradient: 'bg-gradient-to-br from-amber-50 to-orange-100',
      borderColor: 'border-amber-200',
      buttonText: 'Gérer les Règles',
      accent: 'bg-amber-500'
    },
    {
      id: 'rewards',
      title: 'Gérer les Récompenses',
      description: 'Créez des récompenses que vos enfants pourront échanger avec leurs points.',
      icon: Gift,
      color: 'from-violet-600 to-purple-600',
      hoverColor: 'hover:from-violet-600 hover:to-purple-600',
      bgGradient: 'bg-gradient-to-br from-violet-50 to-purple-100',
      borderColor: 'border-violet-200',
      buttonText: 'Gérer les Récompenses',
      accent: 'bg-violet-500'
    },
    {
      id: 'riddles',
      title: 'Gérer les Devinettes',
      description: 'Créez des devinettes quotidiennes pour que vos enfants gagnent des points bonus.',
      icon: Brain,
      color: 'from-cyan-500 to-blue-500',
      hoverColor: 'hover:from-cyan-600 hover:to-blue-600',
      bgGradient: 'bg-gradient-to-br from-cyan-50 to-blue-100',
      borderColor: 'border-cyan-200',
      buttonText: 'Gérer les Devinettes',
      accent: 'bg-cyan-500'
    },
    {
      id: 'shop',
      title: 'Gérer la Boutique',
      description: 'Créez et gérez les articles que vos enfants peuvent acheter avec leurs points.',
      icon: Gift,
      color: 'from-violet-600 to-purple-600',
      hoverColor: 'hover:from-violet-600 hover:to-purple-600',
      bgGradient: 'bg-gradient-to-br from-violet-50 to-purple-100',
      borderColor: 'border-violet-200',
      buttonText: 'Gérer la Boutique',
      accent: 'bg-violet-500'
    }
  ];

  const renderStats = () => (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Aperçu des performances</h3>
          <p className="text-gray-600">Suivez les progrès de votre famille en temps réel</p>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
            <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm border-2 hover:bg-white transition-colors">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dernières 24h</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
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
              className="hover:bg-white/80 backdrop-blur-sm border-2 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats Cards améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Enfants Actifs"
          value={stats.activeChildren}
          icon={<Users className="h-6 w-6 text-white" />}
          color="from-blue-500 to-indigo-600"
          isLoading={stats.isLoading}
          trend={stats.activeChildren > 0 ? 12 : 0}
          subtitle="membres de la famille"
        />
        <StatCard
          title="Tâches Complétées"
          value={stats.completedTasks}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="from-emerald-500 to-teal-600"
          isLoading={stats.isLoading}
          trend={8}
          subtitle="cette période"
        />
        <StatCard
          title="Récompenses Disponibles"
          value={stats.availableRewards}
          icon={<Gift className="h-6 w-6 text-white" />}
          color="from-violet-600 to-purple-700"
          isLoading={stats.isLoading}
          trend={-2}
          subtitle="prêtes à être réclamées"
        />
        <StatCard
          title="Points Totaux"
          value={stats.totalPoints}
          icon={<Star className="h-6 w-6 text-white" />}
          color="from-amber-500 to-orange-600"
          isLoading={stats.isLoading}
          trend={15}
          subtitle="gagnés par la famille"
        />
      </div>

      <Card className="bg-white/90 backdrop-blur-md">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <PiggyBankIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Historique Tirelire</CardTitle>
                <p className="text-purple-100 text-sm">Suivi des transactions de la famille</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
                <SelectTrigger className="w-[180px] bg-white/20 border-0 text-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dernières 24h</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-green-50 p-4 rounded-xl border border-green-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-700">Épargne Totale</h4>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {stats.history.reduce((sum, day) => sum + (day.savings || 0), 0)} pts
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-red-50 p-4 rounded-xl border border-red-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Minus className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-700">Dépenses Totales</h4>
              </div>
              <p className="text-2xl font-bold text-red-800">
                {stats.history.reduce((sum, day) => sum + (day.spending || 0), 0)} pts
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 p-4 rounded-xl border border-blue-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-700">Dons Totaux</h4>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {stats.history.reduce((sum, day) => sum + (day.donation || 0), 0)} pts
              </p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="savings" 
                  stackId="a" 
                  fill="#10B981" 
                  name="Épargne"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="spending" 
                  stackId="a" 
                  fill="#EF4444" 
                  name="Dépense"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="donation" 
                  stackId="a" 
                  fill="#3B82F6" 
                  name="Don"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </CardContent>
      </Card>

      {/* Performances des enfants avec design moderne */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/70 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold mb-2">🏆 Tableau de Performance</CardTitle>
                <p className="text-indigo-100">Suivi détaillé des progrès de chaque enfant</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-300" />
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Enfant</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Points</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Streak 🔥</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Complétées</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">En attente</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Dernière activité</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Progression</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.childrenStats.map((child, index) => (
                    <motion.tr 
                      key={child.id} 
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="relative"
                          >
                            <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                              <AvatarImage src={child.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                                {child.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                          </motion.div>
                          <div>
                            <span className="font-semibold text-gray-800">{child.name}</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-gray-500">Membre</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-lg">{child.points}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">{child.streak}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-medium text-green-600">{child.completedTasks}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-medium text-gray-600">{child.pendingTasks}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-gray-500">
                          {child.lastActivity ? format(new Date(child.lastActivity), 'dd MMM', { locale: fr }) : 'Jamais'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${(child.completedTasks / (child.completedTasks + child.pendingTasks)) * 100}%` }}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ShopItemsOverview userId={user.id} />
      <PurchaseHistory userId={user.id} />
    </div>
  );

  return (
    <div className="flex flex-col space-y-8">
      {/* Boutons de gestion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {dashboardCards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className={`${card.bgGradient} border-2 ${card.borderColor} shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                    <card.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                    <Button
                      onClick={() => setCurrentView(card.id as View)}
                      className={`${card.hoverColor} text-white font-medium px-6 py-2 rounded-lg transition-all duration-300`}
                      style={{ backgroundColor: card.accent }}
                    >
                      {card.buttonText}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gestionnaires */}
      <AnimatePresence mode="wait">
        {currentView === 'children' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Enfants</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView(null)}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ChildrenManager />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'tasks' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Tâches</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView(null)}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <TasksManager />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'rules' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Règles</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView(null)}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <RulesManager />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'rewards' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Récompenses</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView(null)}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <RewardsManager />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'riddles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Devinettes</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView(null)}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <RiddlesManager />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'shop' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion de la Boutique</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView(null)}
                    className="hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ShopManager />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistiques */}
      {!currentView && renderStats()}
    </div>
  );
}