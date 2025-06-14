import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
  AlertCircle,
  Mic,
  Volume2,
  VolumeX,
  Play,
  StopCircle,
  Music,
  Baby,  // au lieu de Child
  User,
  Bot  // au lieu de Robot
  
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
import { DetectedIntent } from '@/lib/gemini';
import { VoiceAssistant } from '../voice/voice-assistant';
import { VoiceSettings } from '../voice/voice-settings';
import { PromptSettings } from '../voice/prompt-settings';
import { toast } from '@/hooks/use-toast';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

type View = 'children' | 'tasks' | 'rules' | 'rewards' | 'riddles' | 'shop' | 'penalties' | 'voice' | null;
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
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    isMuted: false,
    isListening: false,
    preset: 'default',
    transitionSound: true
  });

  const [isTesting, setIsTesting] = useState(false);

  const voicePresets = {
    default: { rate: 1.0, pitch: 1.0, volume: 1.0 },
    child: { rate: 1.2, pitch: 1.3, volume: 1.0 },
    adult: { rate: 0.9, pitch: 0.9, volume: 1.0 },
    robot: { rate: 0.8, pitch: 0.7, volume: 1.0 },
    friendly: { rate: 1.1, pitch: 1.1, volume: 1.0 }
  };

  const testPhrases = [
    "Bonjour ! Je suis votre assistant familial.",
    "Comment puis-je vous aider aujourd'hui ?",
    "N'oubliez pas de faire vos tâches !",
    "Bravo pour vos points !"
  ];

  const applyPreset = (preset: keyof typeof voicePresets) => {
    setVoiceSettings(prev => ({
      ...prev,
      ...voicePresets[preset],
      preset
    }));
  };

  const testVoice = () => {
    if (isTesting) {
      window.speechSynthesis.cancel();
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    const utterance = new SpeechSynthesisUtterance(testPhrases[0]);
    utterance.lang = 'fr-FR';
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    // Sélectionner la meilleure voix française
    const voices = window.speechSynthesis.getVoices();
    const frenchVoices = voices.filter(voice => voice.lang.includes('fr'));
    if (frenchVoices.length > 0) {
      utterance.voice = frenchVoices[0];
    }

    utterance.onend = () => {
      setIsTesting(false);
    };

    window.speechSynthesis.speak(utterance);
  };

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

  // Sauvegarder les réglages dans le localStorage
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // Charger les réglages au démarrage
  useEffect(() => {
    const savedSettings = localStorage.getItem('voiceSettings');
    if (savedSettings) {
      setVoiceSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleVoiceIntent = (intent: DetectedIntent) => {
    if (intent.intent === 'get_points') {
      toast({
        title: 'Points totaux',
        description: `${stats.totalPoints} points`,
      });
    }
  };

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

  const renderManagementCards = () => (
    <div className="flex overflow-x-auto gap-4 pb-4">
      <ManagementCard
        id="children"
        title="Enfants"
        description="Gérer les profils des enfants"
        icon={Users}
        color="from-blue-500 to-indigo-600"
        hoverColor="hover:from-blue-600 hover:to-indigo-700"
        bgGradient="bg-gradient-to-br from-blue-50 to-indigo-50"
        borderColor="border-blue-200"
        buttonText="Gérer"
        accent="bg-blue-500"
        onClick={() => setCurrentView('children')}
      />
      <ManagementCard
        id="tasks"
        title="Tâches"
        description="Gérer les tâches quotidiennes"
        icon={CheckSquare}
        color="from-emerald-500 to-teal-600"
        hoverColor="hover:from-emerald-600 hover:to-teal-700"
        bgGradient="bg-gradient-to-br from-emerald-50 to-teal-50"
        borderColor="border-emerald-200"
        buttonText="Gérer"
        accent="bg-emerald-500"
        onClick={() => setCurrentView('tasks')}
      />
      <ManagementCard
        id="rules"
        title="Règles"
        description="Définir les règles familiales"
        icon={Shield}
        color="from-violet-500 to-purple-600"
        hoverColor="hover:from-violet-600 hover:to-purple-700"
        bgGradient="bg-gradient-to-br from-violet-50 to-purple-50"
        borderColor="border-violet-200"
        buttonText="Gérer"
        accent="bg-violet-500"
        onClick={() => setCurrentView('rules')}
      />
      <ManagementCard
        id="rewards"
        title="Récompenses"
        description="Gérer les récompenses"
        icon={Gift}
        color="from-amber-500 to-orange-600"
        hoverColor="hover:from-amber-600 hover:to-orange-700"
        bgGradient="bg-gradient-to-br from-amber-50 to-orange-50"
        borderColor="border-amber-200"
        buttonText="Gérer"
        accent="bg-amber-500"
        onClick={() => setCurrentView('rewards')}
      />
      <ManagementCard
        id="riddles"
        title="Énigmes"
        description="Gérer les énigmes quotidiennes"
        icon={Brain}
        color="from-rose-500 to-pink-600"
        hoverColor="hover:from-rose-600 hover:to-pink-700"
        bgGradient="bg-gradient-to-br from-rose-50 to-pink-50"
        borderColor="border-rose-200"
        buttonText="Gérer"
        accent="bg-rose-500"
        onClick={() => setCurrentView('riddles')}
      />
      <ManagementCard
        id="shop"
        title="Boutique"
        description="Gérer la boutique de récompenses"
        icon={PiggyBankIcon}
        color="from-cyan-500 to-blue-600"
        hoverColor="hover:from-cyan-600 hover:to-blue-700"
        bgGradient="bg-gradient-to-br from-cyan-50 to-blue-50"
        borderColor="border-cyan-200"
        buttonText="Gérer"
        accent="bg-cyan-500"
        onClick={() => setCurrentView('shop')}
      />
      <ManagementCard
        id="penalties"
        title="Sanctions"
        description="Gérer les sanctions"
        icon={AlertCircle}
        color="from-red-500 to-orange-600"
        hoverColor="hover:from-red-600 hover:to-orange-700"
        bgGradient="bg-gradient-to-br from-red-50 to-orange-50"
        borderColor="border-red-200"
        buttonText="Gérer"
        accent="bg-red-500"
        onClick={() => setCurrentView('penalties')}
      />
      <ManagementCard
        id="voice"
        title="Assistant Vocal"
        description="Configurer l'assistant vocal"
        icon={Mic}
        color="from-indigo-500 to-purple-600"
        hoverColor="hover:from-indigo-600 hover:to-purple-700"
        bgGradient="bg-gradient-to-br from-indigo-50 to-purple-50"
        borderColor="border-indigo-200"
        buttonText="Configurer"
        accent="bg-indigo-500"
        onClick={() => setCurrentView('voice')}
      />
    </div>
  );

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
      case 'shop':
        return <ShopManager />;
      case 'penalties':
        return <PenaltyManager />;
      case 'voice':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assistant Vocal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <VoiceSettings />
                <div className="flex items-center justify-end">
                  <VoiceAssistant onIntent={handleVoiceIntent} />
                </div>
              </CardContent>
            </Card>
            <PromptSettings 
              onSave={(prompt) => {
                toast({
                  title: "Configuration mise à jour",
                  description: "Le comportement de l'assistant a été modifié avec succès.",
                });
              }} 
            />
          </div>
        );
      default:
        return null;
    }
  };

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
      <div className="flex justify-end">
        <VoiceAssistant onIntent={handleVoiceIntent} />
      </div>
      {/* Management Cards */}
      {renderManagementCards()}

      {/* Managers */}
      <AnimatePresence mode="wait">
        {currentView && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderCurrentView()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      {!currentView && renderStats()}

      {/* Panneau de réglages vocaux */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Réglages de la voix
          </CardTitle>
          <CardDescription>
            Personnalisez la voix de votre assistant familial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Préréglages de voix */}
            <div className="space-y-2">
              <Label>Préréglages de voix</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Button
                  variant={voiceSettings.preset === 'default' ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                  onClick={() => applyPreset('default')}
                >
                  <Sparkles className="h-4 w-4" />
                  Par défaut
                </Button>
                <Button
                  variant={voiceSettings.preset === 'child' ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                  onClick={() => applyPreset('child')}
                >
                  <Baby className="h-4 w-4" />
                  Enfant
                </Button>
                <Button
                  variant={voiceSettings.preset === 'adult' ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                  onClick={() => applyPreset('adult')}
                >
                  <User className="h-4 w-4" />
                  Adulte
                </Button>
                <Button
                  variant={voiceSettings.preset === 'robot' ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                  onClick={() => applyPreset('robot')}
                >
                  <Bot className="h-4 w-4" />
                  Robot
                </Button>
                <Button
                  variant={voiceSettings.preset === 'friendly' ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                  onClick={() => applyPreset('friendly')}
                >
                  <Sparkles className="h-4 w-4" />
                  Amical
                </Button>
              </div>
            </div>

            <Separator />

            {/* Test de voix */}
            <div className="space-y-2">
              <Label>Test de voix</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant={isTesting ? "destructive" : "default"}
                  className="flex items-center gap-2"
                  onClick={testVoice}
                >
                  {isTesting ? (
                    <>
                      <StopCircle className="h-4 w-4" />
                      Arrêter
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Tester
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500">
                  {isTesting ? "Test en cours..." : "Écoutez un exemple de voix"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Réglages manuels */}
            <div className="space-y-4">
              <Label>Réglages manuels</Label>
              
              {/* Vitesse de parole */}
              <div className="space-y-2">
                <Label>Vitesse de parole</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[voiceSettings.rate]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => 
                      setVoiceSettings(prev => ({ ...prev, rate: value, preset: 'custom' }))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{voiceSettings.rate.toFixed(1)}x</span>
                </div>
              </div>

              {/* Hauteur de la voix */}
              <div className="space-y-2">
                <Label>Hauteur de la voix</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[voiceSettings.pitch]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => 
                      setVoiceSettings(prev => ({ ...prev, pitch: value, preset: 'custom' }))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{voiceSettings.pitch.toFixed(1)}</span>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <Label>Volume</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[voiceSettings.volume]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => 
                      setVoiceSettings(prev => ({ ...prev, volume: value, preset: 'custom' }))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{Math.round(voiceSettings.volume * 100)}%</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Options supplémentaires */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={voiceSettings.isMuted}
                  onCheckedChange={(checked) => 
                    setVoiceSettings(prev => ({ ...prev, isMuted: checked }))
                  }
                />
                <Label>Mode silencieux</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={voiceSettings.isListening}
                  onCheckedChange={(checked) => 
                    setVoiceSettings(prev => ({ ...prev, isListening: checked }))
                  }
                />
                <Label>Écoute continue</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={voiceSettings.transitionSound}
                  onCheckedChange={(checked) => 
                    setVoiceSettings(prev => ({ ...prev, transitionSound: checked }))
                  }
                />
                <Label className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Effets sonores
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 