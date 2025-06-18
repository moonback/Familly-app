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
  Minus,
  AlertCircle
} from 'lucide-react';
import { ChildrenManager } from '@/components/children/children-manager';
import { TasksManager } from '@/components/tasks/tasks-manager';
import { RulesManager } from '@/components/rules/rules-manager';
import { RewardsManager } from '@/components/rewards/rewards-manager';
import { RiddlesManager } from '@/components/riddles/riddles-manager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '@/lib/supabase';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseHistory } from '@/components/shop/purchase-history';
import { ShopItemsOverview } from '@/components/shop/shop-items-overview';
import { ShopManager } from '@/components/shop/shop-manager';
import { PenaltyManager } from '@/components/penalties/penalty-manager';
import { StatCard } from './StatCard';
import { ChildrenPerformanceTable } from './ChildrenPerformanceTable';
import { RecentActivities } from './RecentActivities';
import { PiggyBankChart } from './PiggyBankChart';
import { ManagementCard } from './ManagementCard';
import { RewardsValidationManager } from '@/components/rewards/rewards-validation-manager';

type View = 'children' | 'tasks' | 'rules' | 'rewards' | 'riddles' | 'shop' | 'penalties' | 'rewards-validation' | null;
type Period = 'day' | 'week' | 'month';

interface DashboardStats {
  totalPoints: number;
  totalTasks: number;
  totalRewards: number;
  totalChildren: number;
  activeChildren: number;
  completedTasks: number;
  availableRewards: number;
  averageCompletion: number;
  isLoading: boolean;
  history: {
    date: string;
    savings: number;
    spending: number;
    donation: number;
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

export const DashboardParent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>(null);
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    totalTasks: 0,
    totalRewards: 0,
    totalChildren: 0,
    activeChildren: 0,
    completedTasks: 0,
    availableRewards: 0,
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

      // Récupérer l'historique des transactions de la tirelire
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
      const history = processHistoryData(piggyHistory || [], period);

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
        totalPoints,
        totalTasks: totalCompletedTasks + totalPendingTasks,
        totalRewards: availableRewardsCount || 0,
        totalChildren: childrenStatsWithStreak.length,
        activeChildren: childrenStatsWithStreak.length,
        completedTasks: totalCompletedTasks,
        availableRewards: availableRewardsCount || 0,
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
    piggyData: any[],
    period: Period
  ) => {
    const groupedData = new Map<string, { savings: number; spending: number; donation: number }>();

    piggyData.forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (!groupedData.has(date)) {
        groupedData.set(date, { savings: 0, spending: 0, donation: 0 });
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
        groupedData.set(dateStr, { savings: 0, spending: 0, donation: 0 });
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
      color: 'text-pink-500',
      hoverColor: 'hover:bg-pink-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-pink-100'
    },
    {
      id: 'tasks',
      title: 'Gérer les Tâches',
      description: 'Définissez les tâches quotidiennes et leurs points de récompense.',
      icon: CheckSquare,
      color: 'text-emerald-500',
      hoverColor: 'hover:bg-emerald-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-emerald-100'
    },
    {
      id: 'rules',
      title: 'Gérer les Règles',
      description: 'Établissez les règles de comportement et les pénalités de points.',
      icon: Shield,
      color: 'text-amber-500',
      hoverColor: 'hover:bg-amber-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-amber-100'
    },
    {
      id: 'rewards',
      title: 'Gérer les Récompenses',
      description: 'Créez des récompenses que vos enfants pourront échanger avec leurs points.',
      icon: Gift,
      color: 'text-violet-500',
      hoverColor: 'hover:bg-violet-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-violet-100'
    },
    {
      id: 'riddles',
      title: 'Gérer les Devinettes',
      description: 'Créez des devinettes quotidiennes pour que vos enfants gagnent des points bonus.',
      icon: Brain,
      color: 'text-cyan-500',
      hoverColor: 'hover:bg-cyan-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-cyan-100'
    },
    {
      id: 'shop',
      title: 'Gérer la Boutique',
      description: 'Créez et gérez les articles que vos enfants peuvent acheter avec leurs points.',
      icon: Gift,
      color: 'text-violet-500',
      hoverColor: 'hover:bg-violet-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-violet-100'
    },
    {
      id: 'penalties',
      title: 'Gérer les Pénalités',
      description: 'Appliquez des pénalités de points pour les règles non respectées.',
      icon: AlertCircle,
      color: 'text-red-500',
      hoverColor: 'hover:bg-red-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-red-100'
    },
    {
      id: 'rewards-validation',
      title: 'Gérer les Validations de Récompenses',
      description: 'Validez les récompenses des enfants.',
      icon: CheckCircle,
      color: 'text-emerald-500',
      hoverColor: 'hover:bg-emerald-50',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
      buttonText: 'Gérer',
      accent: 'bg-emerald-100'
    }
  ];

  const renderManagementCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {dashboardCards.map((card) => (
        <motion.div
          key={card.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative overflow-hidden rounded-lg border ${card.borderColor} ${card.bgColor} ${card.hoverColor} transition-all duration-300 shadow-sm`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${card.accent}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <h3 className="font-medium text-gray-900">{card.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView(card.id as View)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {card.buttonText}
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{card.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );

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

      {/* Stats Cards */}
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
          details={[
            { label: 'En Euros', value: parseFloat((stats.totalPoints / 100).toFixed(2)) }
          ]}
        />
      </div>

      {/* Piggy Bank Chart */}
      <PiggyBankChart 
        data={stats.history}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Children Performance Table */}
      <ChildrenPerformanceTable 
        childrenStats={stats.childrenStats}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Shop Overview */}
      <ShopItemsOverview userId={user.id} />
      <PurchaseHistory userId={user.id} />

      {/* Recent Activities */}
      <RecentActivities activities={stats.recentActivities} />
    </div>
  );

  return (
    <div className="flex flex-col space-y-8 mx-[-1.5rem] px-6">
      {/* Management Cards */}
      {renderManagementCards()}

      {/* Managers */}
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

        {currentView === 'penalties' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Pénalités</CardTitle>
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
                <PenaltyManager />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentView === 'rewards-validation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-800">Gestion des Validations de Récompenses</CardTitle>
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
                <RewardsValidationManager />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      {!currentView && renderStats()}
    </div>
  );
}; 