import { useAuth } from '@/context/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrophyIcon, 
  StarIcon, 
  GiftIcon, 
  BrainIcon, 
  PiggyBankIcon,
  ShoppingCartIcon,
  HomeIcon,
  HeartIcon,
  MessageCircleIcon,
  TargetIcon,
  CheckCircleIcon,
  CalendarIcon,
  UsersIcon,
  AwardIcon,
  BarChart3,
  Loader2,
  Plus,
  Minus,
  PackageIcon,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Hooks personnalisés
import { useTasks } from '@/hooks/useTasks';
import { useRewards } from '@/hooks/useRewards';
import { useRiddles } from '@/hooks/useRiddles';
import { useStreak } from '@/hooks/useStreak';
import { usePointsHistory } from '@/hooks/usePointsHistory';
import { usePiggyBank } from '@/hooks/usePiggyBank';
import { usePurchases } from '@/hooks/usePurchases';
import { useAiAnalysis } from '@/hooks/useAiAnalysis';
import ChildAnalysis from '@/components/analysis/ChildAnalysis';
import ChildChatbot from '@/components/chat/ChildChatbot';
import WeatherWidget from '@/components/WeatherWidget';

interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar_url: string;
  custom_color: string;
  user_id: string;
  created_at: string;
}

interface Task {
  id: string;
  label: string;
  points_reward: number;
  is_daily: boolean;
  age_min: number;
  age_max: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
}

interface ChildTask {
  id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string;
  task: Task;
}

interface Reward {
  id: string;
  label: string;
  cost: number;
}

interface ShopItem {
  id: string;
  name: string;
  price: number;
  user_id: string;
  created_at: string;
}

export default function ChildDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { childName } = useParams();
  const [child, setChild] = useState<Child | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'shop' | 'piggy' | 'riddles' | 'weather' | 'profile' | 'purchases'>('tasks');
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [showRiddleDialog, setShowRiddleDialog] = useState(false);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [showShopDialog, setShowShopDialog] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null);
  const [showPiggyDialog, setShowPiggyDialog] = useState(false);
  const [piggyAmount, setPiggyAmount] = useState('');
  const [showPiggyWithdrawDialog, setShowPiggyWithdrawDialog] = useState(false);
  const [piggyWithdrawAmount, setPiggyWithdrawAmount] = useState('');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const {
    analysis,
    loading: analysisLoading,
    getAnalysis,
    refreshAnalysis,
    getAnalysisFromStorage,
  } = useAiAnalysis(user?.id);

  // Fonction de conversion des points en euros
  const convertPointsToEuros = (points: number) => {
    return (points / 100).toFixed(2);
  };

  const fetchChildData = useCallback(async () => {
    try {
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('name', childName)
        .single();

      if (childError) throw childError;
      setChild(childData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les données",
        variant: 'destructive',
      });
    }
  }, [childName]);

  const fetchShopItems = useCallback(async () => {
    if (!child) return;
    
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('user_id', child.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShopItems(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les articles de la boutique",
        variant: 'destructive',
      });
    } finally {
      setShopLoading(false);
    }
  }, [child]);

  // Utilisation des hooks personnalisés
  const { childTasks, isLoading: tasksLoading, toggleTask } = useTasks(child, fetchChildData);
  const { rewards, claimedRewards, claimReward, claiming, isRewardClaimed, isRewardValidated, getRewardStats, getProgressToNextReward } = useRewards(child, fetchChildData);
  const { currentRiddle, riddleSolved, showSuccess, hintPurchased, hintText, submitRiddleAnswer, purchaseHint } = useRiddles(child, fetchChildData);
  const { streak } = useStreak(child);
  const { pointsHistory } = usePointsHistory(child);
  const { transactions: piggyTransactions, loading: piggyLoading, depositing, depositPoints, withdrawPoints, getPiggyBankStats } = usePiggyBank(child, fetchChildData);
  const { purchases, loading: purchasesLoading, getPurchaseStats } = usePurchases(child);

  // États pour l'analyse IA
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user && childName) {
      fetchChildData();
    }
  }, [user, loading, navigate, childName]);

  useEffect(() => {
    if (child) {
      fetchShopItems();
    }
  }, [child, fetchShopItems]);

  // Scroll automatique vers le haut au chargement de la page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTaskToggle = async (childTaskId: string, isCompleted: boolean) => {
    await toggleTask(childTaskId, isCompleted);
    if (!isCompleted) {
      setCompletedTaskId(childTaskId);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        setCompletedTaskId(null);
      }, 3000);
    }
  };

  const handleRiddleSubmit = async () => {
    if (riddleAnswer.trim()) {
      await submitRiddleAnswer(riddleAnswer);
      setRiddleAnswer('');
      setShowRiddleDialog(false);
    }
  };

  const handleShopPurchase = async () => {
    if (selectedShopItem && child) {
      try {
        const piggyStats = getPiggyBankStats();
        const totalAvailablePoints = child.points + piggyStats.currentBalance;
        
        if (totalAvailablePoints < selectedShopItem.price) {
          toast({
            title: 'Points insuffisants',
            description: "Tu n'as pas assez de points pour cet achat",
            variant: 'destructive',
          });
          return;
        }

        // Calculer combien de points utiliser de chaque source
        let pointsFromWallet = Math.min(child.points, selectedShopItem.price);
        let pointsFromPiggy = selectedShopItem.price - pointsFromWallet;

        // Si on n'a pas assez de points disponibles, utiliser plus de points épargnés
        if (pointsFromWallet < selectedShopItem.price) {
          pointsFromPiggy = selectedShopItem.price - pointsFromWallet;
        }

        // Créer l'achat
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert([{
            child_id: child.id,
            item_id: selectedShopItem.id,
            purchased_at: new Date().toISOString()
          }]);

        if (purchaseError) throw purchaseError;

        // Mettre à jour les points de l'enfant
        const newWalletPoints = child.points - pointsFromWallet;
        const { error: updateError } = await supabase
          .from('children')
          .update({ points: newWalletPoints })
          .eq('id', child.id);

        if (updateError) throw updateError;

        // Si on utilise des points épargnés, créer une transaction de dépense
        if (pointsFromPiggy > 0) {
          const { error: piggyError } = await supabase
            .from('piggy_bank_transactions')
            .insert([{
              child_id: child.id,
              type: 'spending',
              points: pointsFromPiggy,
              created_at: new Date().toISOString()
            }]);

          if (piggyError) throw piggyError;
        }

        // Message de confirmation avec détails
        let message = `Tu as acheté ${selectedShopItem.name} !`;
        if (pointsFromWallet > 0 && pointsFromPiggy > 0) {
          message += ` (${pointsFromWallet} points disponibles + ${pointsFromPiggy} points épargnés)`;
        } else if (pointsFromWallet > 0) {
          message += ` (${pointsFromWallet} points disponibles)`;
        } else {
          message += ` (${pointsFromPiggy} points épargnés)`;
        }

        toast({
          title: 'Achat réussi !',
          description: message,
        });

        setShowShopDialog(false);
        setSelectedShopItem(null);
        fetchChildData();
        // Recharger les achats pour mettre à jour l'onglet "Mes Achats"
        if (activeTab === 'purchases') {
          // Le hook usePurchases se rechargera automatiquement grâce au useEffect
        }
      } catch (error) {
        console.error('Erreur lors de l\'achat:', error);
        toast({
          title: 'Erreur',
          description: "Impossible d'effectuer l'achat",
          variant: 'destructive',
        });
      }
    }
  };

  const handlePiggyDeposit = async () => {
    if (piggyAmount && child) {
      const amount = parseInt(piggyAmount);
      const success = await depositPoints(amount);
      if (success) {
        setShowPiggyDialog(false);
        setPiggyAmount('');
      }
    }
  };

  const handlePiggyWithdraw = async () => {
    if (piggyWithdrawAmount && child) {
      const amount = parseInt(piggyWithdrawAmount);
      const success = await withdrawPoints(amount);
      if (success) {
        setShowPiggyWithdrawDialog(false);
        setPiggyWithdrawAmount('');
      }
    }
  };

  const handleOpenAnalysis = async () => {
    if (!child) return;
    setShowAnalysis(true);
    
    // Vérifier d'abord s'il y a une analyse en cache
    const cachedAnalysis = getAnalysisFromStorage(child.id);
    if (cachedAnalysis) {
      setIsFromCache(true);
      setLastUpdated(new Date().toISOString());
    } else {
      setIsFromCache(false);
      setLastUpdated(null);
    }
    
    await getAnalysis(child.id);
  };

  const handleRefreshAnalysis = async () => {
    if (!child) return;
    
    setIsFromCache(false);
    setLastUpdated(null);
    
    const result = await refreshAnalysis(child.id);
    if (result) {
      setLastUpdated(new Date().toISOString());
      toast({
        title: 'Analyse actualisée',
        description: 'L\'analyse IA a été mise à jour avec les dernières données',
      });
    }
  };

  const handleTabChange = (newTab: typeof activeTab) => {
    setActiveTab(newTab);
    // Scroll vers le haut avec animation douce
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quotidien': return '🌅';
      case 'scolaire': return '📚';
      case 'maison': return '🏠';
      case 'personnel': return '🌟';
      default: return '✅';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quotidien': return 'from-blue-400 to-blue-600';
      case 'scolaire': return 'from-green-400 to-green-600';
      case 'maison': return 'from-orange-400 to-orange-600';
      case 'personnel': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading || tasksLoading || piggyLoading || purchasesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-purple-600 font-semibold">
            {loading ? 'Vérification de la session...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !child) {
    if (!loading && user && childName) {
      // L'utilisateur est connecté mais l'enfant n'existe pas
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Enfant non trouvé</h1>
            <p className="text-gray-600 mb-6">
              L'enfant "{childName}" n'existe pas ou vous n'avez pas les permissions pour y accéder.
            </p>
            <button
              onClick={() => navigate('/dashboard/parent')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Retour au dashboard parent
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const totalTasks = childTasks.length;
  const completedTasks = childTasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header compact et professionnel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-lg border-b border-slate-200/60 fixed top-0 left-0 right-0 z-50 shadow-sm"
      >
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Avatar et nom */}
            <div className="flex items-center gap-3">
              {child.avatar_url ? (
                <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm ring-1 ring-slate-200">
                  <img 
                    src={child.avatar_url} 
                    alt={`Photo de ${child.name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div 
                    className={`w-full h-full flex items-center justify-center text-white text-sm font-semibold ${
                      child.avatar_url ? 'hidden' : ''
                    }`}
                    style={{ backgroundColor: child.custom_color }}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm ring-1 ring-slate-200"
                  style={{ backgroundColor: child.custom_color }}
                >
                  {child.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-slate-900">Salut {child.name} ! 👋</h1>
                <p className="text-xs text-slate-500">Prêt pour de nouvelles aventures ?</p>
              </div>
            </div>

            {/* Points compacts */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2.5 py-1 rounded-md font-medium text-xs shadow-sm flex items-center gap-1">
                <StarIcon className="w-3 h-3" />
                <span>{child.points}</span>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-1 rounded-md font-medium text-xs shadow-sm flex items-center gap-1">
                <PiggyBankIcon className="w-3 h-3" />
                <span>{getPiggyBankStats().currentBalance}</span>
              </div>
            </div>

            {/* Météo compacte */}
            <div className="hidden lg:block">
              <WeatherWidget city="Paris" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contenu principal optimisé */}
      <div className="pt-6 pb-20">
        <div className="container mx-auto px-4">
          
          {/* Navigation par onglets compacte */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-slate-200/50">
              <div className="flex items-center gap-1">
                {[
                  { id: 'tasks', label: 'Missions', icon: TargetIcon, color: 'from-blue-500 to-indigo-500' },
                  { id: 'rewards', label: 'Récompenses', icon: TrophyIcon, color: 'from-amber-500 to-orange-500' },
                  { id: 'shop', label: 'Boutique', icon: ShoppingCartIcon, color: 'from-emerald-500 to-teal-500' },
                  { id: 'piggy', label: 'Tirelire', icon: PiggyBankIcon, color: 'from-purple-500 to-pink-500' },
                  { id: 'riddles', label: 'Devinettes', icon: BrainIcon, color: 'from-indigo-500 to-purple-500' },
                  { id: 'profile', label: 'Profil', icon: UsersIcon, color: 'from-slate-500 to-gray-500' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as typeof activeTab)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-sm`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenu des onglets optimisé */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Onglet Missions - Version compacte */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {/* Stats rapides */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-2xl font-bold text-blue-600">{completedTasks}</div>
                      <div className="text-xs text-slate-600">Complétées</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-2xl font-bold text-slate-600">{totalTasks}</div>
                      <div className="text-xs text-slate-600">Total</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-2xl font-bold text-orange-600">{streak}</div>
                      <div className="text-xs text-slate-600">Jours 🔥</div>
                    </div>
                  </div>

                  {/* Progression */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>Progression</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Missions en grille compacte */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {childTasks.map((childTask) => (
                      <motion.div
                        key={childTask.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative rounded-xl p-4 border transition-all duration-200 ${
                          childTask.is_completed 
                            ? 'bg-green-50/80 border-green-200' 
                            : 'bg-white/80 border-slate-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        {completedTaskId === childTask.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 bg-green-400/20 flex items-center justify-center z-10 rounded-xl"
                          >
                            <CheckCircleIcon className="w-8 h-8 text-green-600 animate-bounce" />
                          </motion.div>
                        )}
                        
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(childTask.task.category)}</span>
                            <Badge className={`text-xs ${getCategoryColor(childTask.task.category)} text-white`}>
                              {childTask.task.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                            className={`w-8 h-8 p-0 rounded-lg ${
                              childTask.is_completed 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                          >
                            {childTask.is_completed ? <CheckCircleIcon className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
                          </Button>
                        </div>
                        
                        <h3 className={`text-sm font-medium mb-2 ${
                          childTask.is_completed ? 'line-through text-slate-500' : 'text-slate-800'
                        }`}>
                          {childTask.task.label}
                        </h3>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-amber-600 font-medium">
                            <StarIcon className="w-3 h-3" />
                            {childTask.task.points_reward} pts
                          </div>
                          <div className="text-slate-500">
                            {format(new Date(childTask.due_date), 'dd/MM', { locale: fr })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {childTasks.length === 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-200/50">
                      <div className="text-4xl mb-3">🎯</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucune mission pour aujourd'hui !</h3>
                      <p className="text-slate-600">Tes missions seront bientôt disponibles !</p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Récompenses - Version compacte */}
              {activeTab === 'rewards' && (
                <div className="space-y-4">
                  {/* Stats rapides */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-amber-600">{rewards.filter(r => !isRewardClaimed(r.id) && child.points >= r.cost).length}</div>
                      <div className="text-xs text-slate-600">Disponibles</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-green-600">{claimedRewards.filter(cr => isRewardValidated(cr.reward_id)).length}</div>
                      <div className="text-xs text-slate-600">Validées</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-orange-600">{claimedRewards.filter(cr => !isRewardValidated(cr.reward_id)).length}</div>
                      <div className="text-xs text-slate-600">En attente</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-slate-600">{child.points}</div>
                      <div className="text-xs text-slate-600">Points</div>
                    </div>
                  </div>

                  {/* Récompenses disponibles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rewards.map((reward) => {
                      const isClaimed = isRewardClaimed(reward.id);
                      const canAfford = child.points >= reward.cost;
                      
                      if (isClaimed) return null;
                      
                      return (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-xl p-4 border transition-all duration-200 ${
                            canAfford 
                              ? 'bg-amber-50/80 border-amber-200 hover:border-amber-300' 
                              : 'bg-slate-50/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                              <GiftIcon className="w-4 h-4" />
                            </div>
                            <Badge className={`text-xs ${
                              canAfford ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {reward.cost} pts
                            </Badge>
                          </div>
                          
                          <h3 className="text-sm font-medium text-slate-800 mb-3">{reward.label}</h3>
                          
                          <Button
                            onClick={() => claimReward(reward.id)}
                            disabled={!canAfford || claiming === reward.id}
                            className={`w-full text-xs ${
                              canAfford 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' 
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {claiming === reward.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                Réclamation...
                              </>
                            ) : canAfford ? (
                              <>
                                <GiftIcon className="w-3 h-3 mr-1" />
                                Réclamer
                              </>
                            ) : (
                              <>
                                <StarIcon className="w-3 h-3 mr-1" />
                                {reward.cost - child.points} pts manquants
                              </>
                            )}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {rewards.length === 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-200/50">
                      <div className="text-4xl mb-3">🎁</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Aucune récompense disponible</h3>
                      <p className="text-slate-600">Demande à tes parents d'ajouter des récompenses !</p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Boutique - Version compacte */}
              {activeTab === 'shop' && (
                <div className="space-y-4">
                  {/* Stats rapides */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-amber-600">{child.points}</div>
                      <div className="text-xs text-slate-600">Disponibles</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-emerald-600">{getPiggyBankStats().currentBalance}</div>
                      <div className="text-xs text-slate-600">Épargnés</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-slate-600">{shopItems.length}</div>
                      <div className="text-xs text-slate-600">Articles</div>
                    </div>
                  </div>

                  {/* Articles en grille compacte */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {shopItems.map((item) => {
                      const piggyStats = getPiggyBankStats();
                      const totalAvailablePoints = child.points + piggyStats.currentBalance;
                      const canAfford = totalAvailablePoints >= item.price;
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 hover:border-emerald-300 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                              <ShoppingCartIcon className="w-4 h-4" />
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                              {item.price} pts
                            </Badge>
                          </div>
                          
                          <h3 className="text-sm font-medium text-slate-800 mb-2">{item.name}</h3>
                          <p className="text-xs text-slate-600 mb-3">Article disponible en boutique</p>
                          
                          <Button
                            onClick={() => {
                              setSelectedShopItem(item);
                              setShowShopDialog(true);
                            }}
                            disabled={!canAfford}
                            className={`w-full text-xs ${
                              canAfford 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white' 
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCartIcon className="w-3 h-3 mr-1" />
                            {canAfford ? 'Acheter' : 'Points insuffisants'}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {shopItems.length === 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-200/50">
                      <div className="text-4xl mb-3">🛒</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Boutique vide !</h3>
                      <p className="text-slate-600">Demande à tes parents d'ajouter des articles à la boutique.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Tirelire - Version compacte */}
              {activeTab === 'piggy' && (
                <div className="space-y-4">
                  {/* Stats rapides */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-orange-600">{getPiggyBankStats().currentBalance}</div>
                      <div className="text-xs text-slate-600">Solde</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-emerald-600">{getPiggyBankStats().totalSavings}</div>
                      <div className="text-xs text-slate-600">Épargné</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-red-600">{getPiggyBankStats().totalSpending}</div>
                      <div className="text-xs text-slate-600">Dépensé</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-200/50 text-center">
                      <div className="text-xl font-bold text-slate-600">{getPiggyBankStats().transactionCount}</div>
                      <div className="text-xs text-slate-600">Transactions</div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
                      <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                        <PiggyBankIcon className="w-4 h-4 text-orange-600" />
                        Déposer
                      </h4>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={piggyAmount}
                          onChange={(e) => setPiggyAmount(e.target.value)}
                          placeholder="Points à déposer"
                          max={child.points}
                          className="text-sm"
                        />
                        <div className="flex gap-1">
                          {[10, 20, 50, 100].map((val) => (
                            <Button
                              key={val}
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1"
                              onClick={() => setPiggyAmount(String(val))}
                              disabled={val > child.points}
                            >
                              {val}
                            </Button>
                          ))}
                        </div>
                        <Button
                          onClick={() => setShowPiggyDialog(true)}
                          disabled={!piggyAmount || parseInt(piggyAmount) <= 0 || parseInt(piggyAmount) > child.points}
                          className="w-full text-xs bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                        >
                          <PiggyBankIcon className="w-3 h-3 mr-1" />
                          Déposer
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
                      <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                        <Minus className="w-4 h-4 text-blue-600" />
                        Retirer
                      </h4>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={piggyWithdrawAmount}
                          onChange={(e) => setPiggyWithdrawAmount(e.target.value)}
                          placeholder="Points à retirer"
                          max={getPiggyBankStats().currentBalance}
                          className="text-sm"
                        />
                        <div className="flex gap-1">
                          {[10, 20, 50, 100].map((val) => (
                            <Button
                              key={val}
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1"
                              onClick={() => setPiggyWithdrawAmount(String(val))}
                              disabled={val > getPiggyBankStats().currentBalance}
                            >
                              {val}
                            </Button>
                          ))}
                        </div>
                        <Button
                          onClick={() => setShowPiggyWithdrawDialog(true)}
                          disabled={!piggyWithdrawAmount || parseInt(piggyWithdrawAmount) <= 0 || parseInt(piggyWithdrawAmount) > getPiggyBankStats().currentBalance}
                          className="w-full text-xs bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          Retirer
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Historique compact */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50">
                    <h4 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-slate-600" />
                      Historique récent
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {piggyTransactions.slice(0, 5).map((transaction) => (
                        <div
                          key={transaction.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                            transaction.type === 'savings' 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${
                              transaction.type === 'savings' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {transaction.type === 'savings' ? (
                                <Plus className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                            </div>
                            <span className="font-medium">
                              {transaction.type === 'savings' ? 'Épargne' : 'Dépense'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${
                              transaction.type === 'savings' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'savings' ? '+' : '-'}{transaction.points} pts
                            </div>
                            <div className="text-slate-500">
                              {format(new Date(transaction.created_at), 'dd/MM', { locale: fr })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Devinettes - Version compacte */}
              {activeTab === 'riddles' && (
                <div className="space-y-4">
                  {currentRiddle ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 text-center">
                      <div className="text-4xl mb-4">🧩</div>
                      <div className={`rounded-xl p-4 border-2 mb-4 ${
                        riddleSolved 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-purple-50 border-purple-200'
                      }`}>
                        <h3 className="text-lg font-medium text-slate-800 mb-3">{currentRiddle.question}</h3>
                        <p className="text-sm text-slate-600 mb-3">Récompense : {currentRiddle.points} points</p>
                        
                        {hintPurchased && !riddleSolved && (
                          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">💡</span>
                              <span className="text-sm font-medium text-amber-800">Indice :</span>
                            </div>
                            <p className="text-sm text-amber-700">{hintText}</p>
                          </div>
                        )}
                        
                        {riddleSolved ? (
                          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Bravo ! Tu as résolu la devinette d'aujourd'hui !</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Button
                              onClick={() => setShowRiddleDialog(true)}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                            >
                              <BrainIcon className="w-4 h-4 mr-2" />
                              Répondre
                            </Button>
                            
                            {!hintPurchased && (
                              <Button
                                onClick={purchaseHint}
                                variant="outline"
                                disabled={child.points < 5 || !currentRiddle?.hint}
                                className="text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                              >
                                💡 Acheter un indice (5 points)
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-200/50">
                      <div className="text-4xl mb-3">🎉</div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Bravo !</h3>
                      <p className="text-slate-600">Tu as résolu toutes les devinettes d'aujourd'hui !</p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Profil - Version compacte */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* Avatar et infos principales */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 text-center">
                    {child.avatar_url ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mx-auto mb-4 border-4 border-purple-200">
                        <img 
                          src={child.avatar_url} 
                          alt={`Photo de ${child.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto mb-4 border-4 border-purple-200"
                        style={{ backgroundColor: child.custom_color }}
                      >
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{child.name}</h3>
                    <p className="text-slate-600 mb-3">{child.age} {child.age > 1 ? 'ans' : 'an'}</p>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        <StarIcon className="w-4 h-4 mr-1" />
                        {child.points} pts
                      </span>
                      <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        <AwardIcon className="w-4 h-4 mr-1" />
                        {streak} j 🔥
                      </span>
                      <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        <TargetIcon className="w-4 h-4 mr-1" />
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>
                  </div>

                  {/* Statistiques détaillées */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 text-center">
                      <div className="text-2xl font-bold text-amber-600 mb-1">{child.points}</div>
                      <div className="text-xs text-slate-600">Points actuels</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">{getPiggyBankStats().currentBalance}</div>
                      <div className="text-xs text-slate-600">Points épargnés</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">{streak}</div>
                      <div className="text-xs text-slate-600">Jours consécutifs</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{completedTasks}</div>
                      <div className="text-xs text-slate-600">Missions réussies</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Animation de confettis */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </div>
        </div>
      )}

      {/* Dialogues */}
      
      {/* Dialogue Devinette */}
      <Dialog open={showRiddleDialog} onOpenChange={setShowRiddleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainIcon className="w-5 h-5 text-purple-600" />
              Répondre à la devinette
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">{currentRiddle?.question}</p>
            <div>
              <Label htmlFor="riddle-answer">Ta réponse</Label>
              <Input
                id="riddle-answer"
                value={riddleAnswer}
                onChange={(e) => setRiddleAnswer(e.target.value)}
                placeholder="Écris ta réponse ici..."
                disabled={riddleSolved}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRiddleSubmit}
                disabled={riddleSolved || !riddleAnswer.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {riddleSolved ? 'Déjà résolu' : 'Valider'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRiddleDialog(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="w-[95vw] h-[95vh] max-w-none max-h-none p-0 md:p-0 bg-gradient-to-br from-slate-50 to-blue-50">
          <DialogHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="drop-shadow-lg">Analyse IA Intelligente</span>
            </DialogTitle>
          </DialogHeader>
          
          {analysisLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-300/50 rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-16 h-16 border-2 border-purple-400/30 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-gray-700 font-semibold text-lg animate-pulse">
                  Analyse IA en cours...
                </p>
                <p className="text-gray-500 text-sm">
                  Nous analysons tes données pour des recommandations personnalisées
                </p>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
          
          {!analysisLoading && analysis && (
            <div className="h-full overflow-hidden">
              <ChildAnalysis 
                analysis={analysis} 
                childTasks={childTasks}
                availableRewards={rewards}
                childPoints={child?.points || 0}
                child={child}
                streak={streak}
                piggyBankStats={getPiggyBankStats()}
                purchaseStats={getPurchaseStats()}
                onRefreshAnalysis={handleRefreshAnalysis}
                isFromCache={isFromCache}
                lastUpdated={lastUpdated}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ChildChatbot open={showChatbot} onOpenChange={setShowChatbot} />

      {/* Dialogue Boutique */}
      <Dialog open={showShopDialog} onOpenChange={setShowShopDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-green-600" />
              Confirmer l'achat
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedShopItem && (() => {
              const piggyStats = getPiggyBankStats();
              const totalAvailablePoints = child.points + piggyStats.currentBalance;
              const pointsFromWallet = Math.min(child.points, selectedShopItem.price);
              const pointsFromPiggy = selectedShopItem.price - pointsFromWallet;
              
              return (
                <>
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200">
                    <h3 className="font-semibold text-gray-800 mb-2">{selectedShopItem.name}</h3>
                    <p className="text-gray-600 mb-2">Article disponible en boutique</p>
                    <div className="flex items-center gap-2 mb-3">
                      <StarIcon className="w-4 h-4 text-yellow-600" />
                      <span className="font-bold text-yellow-600">{selectedShopItem.price} points</span>
                      <span className="text-sm text-gray-500">(≈ {convertPointsToEuros(selectedShopItem.price)} €)</span>
                    </div>
                    
                    {/* Détails de l'utilisation des points */}
                    <div className="bg-white/50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Répartition du paiement :</p>
                      <div className="space-y-1">
                        {pointsFromWallet > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <StarIcon className="w-3 h-3 text-yellow-600" />
                              Points disponibles
                            </span>
                            <span className="font-medium">{pointsFromWallet} pts</span>
                          </div>
                        )}
                        {pointsFromPiggy > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <PiggyBankIcon className="w-3 h-3 text-green-600" />
                              Points épargnés
                            </span>
                            <span className="font-medium">{pointsFromPiggy} pts</span>
                          </div>
                        )}
                        <div className="border-t border-green-200 pt-1 mt-1">
                          <div className="flex items-center justify-between text-sm font-bold">
                            <span>Total</span>
                            <span>{selectedShopItem.price} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Avertissement si utilisation des points épargnés */}
                  {pointsFromPiggy > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <PiggyBankIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Attention</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Cet achat utilisera {pointsFromPiggy} points de ta tirelire.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleShopPurchase}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                    >
                      <ShoppingCartIcon className="w-4 h-4 mr-2" />
                      Confirmer l'achat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowShopDialog(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue Tirelire */}
      <Dialog open={showPiggyDialog} onOpenChange={setShowPiggyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBankIcon className="w-5 h-5 text-orange-600" />
              Confirmer le dépôt
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
              <p className="text-gray-800 mb-2">Tu vas déposer :</p>
              <div className="flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-600">{piggyAmount} points</span>
                <span className="text-sm text-gray-500">(≈ {convertPointsToEuros(parseInt(piggyAmount) || 0)} €)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePiggyDeposit}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Confirmer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPiggyDialog(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue Tirelire */}
      <Dialog open={showPiggyWithdrawDialog} onOpenChange={setShowPiggyWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBankIcon className="w-5 h-5 text-orange-600" />
              Confirmer le retrait
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
              <p className="text-gray-800 mb-2">Tu vas retirer :</p>
              <div className="flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-600">{piggyWithdrawAmount} points</span>
                <span className="text-sm text-gray-500">(≈ {convertPointsToEuros(parseInt(piggyWithdrawAmount) || 0)} €)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePiggyWithdraw}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                Confirmer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPiggyWithdrawDialog(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
