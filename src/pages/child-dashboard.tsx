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
  TargetIcon,
  CheckCircleIcon,
  CalendarIcon,
  UsersIcon,
  AwardIcon,
  Plus,
  Minus,
  PackageIcon,
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'shop' | 'piggy' | 'riddles' | 'profile' | 'purchases'>('tasks');
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
  const { rewards, claimedRewards, claimReward, claiming, isRewardClaimed, getRewardStats, getProgressToNextReward } = useRewards(child, fetchChildData);
  const { currentRiddle, riddleSolved, showSuccess, hintPurchased, hintText, submitRiddleAnswer, purchaseHint } = useRiddles(child, fetchChildData);
  const { streak } = useStreak(child);
  const { pointsHistory } = usePointsHistory(child);
  const { transactions: piggyTransactions, loading: piggyLoading, depositing, depositPoints, withdrawPoints, getPiggyBankStats } = usePiggyBank(child, fetchChildData);
  const { purchases, loading: purchasesLoading, getPurchaseStats } = usePurchases(child);

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

  const tabs = [
    { id: 'tasks', label: 'Mes Missions', icon: TargetIcon, color: 'text-blue-600' },
    { id: 'rewards', label: 'Mes Récompenses', icon: TrophyIcon, color: 'text-yellow-600' },
    { id: 'shop', label: 'Boutique', icon: ShoppingCartIcon, color: 'text-green-600' },
    { id: 'purchases', label: 'Mes Achats', icon: PackageIcon, color: 'text-indigo-600' },
    { id: 'piggy', label: 'Ma Tirelire', icon: PiggyBankIcon, color: 'text-orange-600' },
    { id: 'riddles', label: 'Devinettes', icon: BrainIcon, color: 'text-purple-600' },
    { id: 'profile', label: 'Mon Profil', icon: UsersIcon, color: 'text-pink-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* Header avec avatar et points */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-purple-200 fixed top-0 left-0 right-0 z-50"
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Section gauche - Avatar et nom */}
            <div className="flex items-center gap-3">
              {child.avatar_url ? (
                <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg">
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
                    className={`w-full h-full flex items-center justify-center text-white text-xl font-bold ${
                      child.avatar_url ? 'hidden' : ''
                    }`}
                    style={{ backgroundColor: child.custom_color }}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div 
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold shadow-lg"
                  style={{ backgroundColor: child.custom_color }}
                >
                  {child.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-800">Salut {child.name} ! 👋</h1>
                <p className="text-sm text-gray-600">Prêt pour de nouvelles aventures ?</p>
              </div>
            </div>

            {/* Section centrale - Points */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                <StarIcon className="inline-block w-4 h-4 mr-1" />
                {child.points} pts ({convertPointsToEuros(child.points)}€)
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                <PiggyBankIcon className="inline-block w-4 h-4 mr-1" />
                {getPiggyBankStats().currentBalance} épargnés ({convertPointsToEuros(getPiggyBankStats().currentBalance)}€)
              </div>
            </div>
            
            
          </div>
        </div>
      </motion.div>

      {/* Contenu principal avec padding-top réduit pour le header compact */}
      <div className="pt-20 pb-24">
        {/* Navigation par onglets */}
        <div className="container mx-auto p-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-6 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`h-12 rounded-xl font-medium transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                        : 'hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Contenu des onglets */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Onglet Missions */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  {/* Progression générale */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <TargetIcon className="w-8 h-8 text-blue-600" />
                        Mes Missions du Jour
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-blue-600 mb-2">{completedTasks}</div>
                          <div className="text-gray-600">Missions accomplies</div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-purple-600 mb-2">{totalTasks}</div>
                          <div className="text-gray-600">Total des missions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-green-600 mb-2">{streak}</div>
                          <div className="text-gray-600">Jours consécutifs 🔥</div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progression</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Liste des missions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {childTasks.map((childTask) => (
                      <motion.div
                        key={childTask.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ${
                          childTask.is_completed 
                            ? 'bg-green-50 border-2 border-green-200' 
                            : 'bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {completedTaskId === childTask.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 bg-green-400/20 flex items-center justify-center z-10"
                          >
                            <CheckCircleIcon className="w-16 h-16 text-green-600 animate-bounce" />
                          </motion.div>
                        )}
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{getCategoryIcon(childTask.task.category)}</span>
                              <Badge className={`bg-gradient-to-r ${getCategoryColor(childTask.task.category)} text-white`}>
                                {childTask.task.category}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTaskToggle(childTask.id, childTask.is_completed)}
                              className={`rounded-full w-10 h-10 ${
                                childTask.is_completed 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                              }`}
                            >
                              {childTask.is_completed ? <CheckCircleIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                            </Button>
                          </div>
                          
                          <h3 className={`text-lg font-semibold mb-3 ${
                            childTask.is_completed ? 'line-through text-gray-500' : 'text-gray-800'
                          }`}>
                            {childTask.task.label}
                          </h3>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-yellow-600 font-bold">
                              <StarIcon className="w-4 h-4" />
                              {childTask.task.points_reward} points
                              <span className="text-xs text-gray-500">(≈ {convertPointsToEuros(childTask.task.points_reward)} €)</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(childTask.due_date), 'dd/MM', { locale: fr })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {childTasks.length === 0 && (
                    <Card className="bg-white/80 backdrop-blur-sm text-center py-12">
                      <CardContent>
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune mission pour aujourd'hui !</h3>
                        <p className="text-gray-600">Tes missions seront bientôt disponibles !</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Onglet Récompenses */}
              {activeTab === 'rewards' && (
                <div className="space-y-6">
                  {/* Statistiques des récompenses */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <TrophyIcon className="w-8 h-8 text-yellow-600" />
                        Mes Récompenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                          <div className="text-2xl font-bold text-yellow-600">{rewards.filter(r => !isRewardClaimed(r.id)).length}</div>
                          <div className="text-sm text-gray-600">Récompenses disponibles</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200 text-center">
                          <div className="text-2xl font-bold text-green-600">{claimedRewards.length}</div>
                          <div className="text-sm text-gray-600">Récompenses réclamées</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 text-center">
                          <div className="text-2xl font-bold text-purple-600">{child.points}</div>
                          <div className="text-sm text-gray-600">Points disponibles</div>
                          <div className="text-xs text-purple-500 mt-1">≈ {convertPointsToEuros(child.points)} €</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200 text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {rewards.filter(r => child.points >= r.cost).length}
                          </div>
                          <div className="text-sm text-gray-600">Accessibles maintenant</div>
                        </div>
                      </div>

                      {/* Barre de progression vers la prochaine récompense */}
                      {(() => {
                        const { progress, pointsNeeded, nextReward } = getProgressToNextReward();
                        if (nextReward) {
                          return (
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-800">
                                  {progress >= 100 ? '🎉' : '🎯'} Prochaine récompense
                                </h4>
                                <span className="text-sm text-gray-600">
                                  {progress >= 100 ? 'Prête !' : `${Math.round(progress)}%`}
                                </span>
                              </div>
                              <div className="mb-2">
                                <div className="text-sm text-gray-700 mb-1">
                                  {nextReward.label} ({nextReward.cost} points ≈ {convertPointsToEuros(nextReward.cost)} €)
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                              {progress < 100 && (
                                <div className="text-xs text-gray-600">
                                  Il te faut encore {pointsNeeded} points pour débloquer cette récompense
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {rewards.length > 0 ? (
                        <div className="space-y-6">
                          {/* Récompenses disponibles */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <GiftIcon className="w-5 h-5 text-green-600" />
                              Récompenses disponibles
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {rewards.map((reward) => {
                                const isClaimed = isRewardClaimed(reward.id);
                                const canAfford = child.points >= reward.cost;
                                const isClaiming = claiming === reward.id;
                                
                                return (
                                  <motion.div
                                    key={reward.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`rounded-2xl p-6 border-2 shadow-lg transition-all duration-300 ${
                                      isClaimed 
                                        ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200' 
                                        : canAfford
                                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:border-yellow-300'
                                          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <div className={`p-3 rounded-full ${
                                        isClaimed 
                                          ? 'bg-green-100 text-green-600' 
                                          : canAfford
                                            ? 'bg-yellow-100 text-yellow-600'
                                            : 'bg-gray-100 text-gray-400'
                                      }`}>
                                        <GiftIcon className="w-6 h-6" />
                                      </div>
                                      <Badge className={`${
                                        isClaimed 
                                          ? 'bg-green-100 text-green-800' 
                                          : canAfford
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {reward.cost} points
                                      </Badge>
                                      <div className="text-xs text-gray-500 mt-1">≈ {convertPointsToEuros(reward.cost)} €</div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{reward.label}</h3>
                                    
                                    {isClaimed ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-green-600 font-bold">
                                          <CheckCircleIcon className="w-5 h-5" />
                                          <span>Réclamée !</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Tu as déjà réclamé cette récompense</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <Button
                                          onClick={() => claimReward(reward.id)}
                                          disabled={!canAfford || isClaiming}
                                          className={`w-full ${
                                            canAfford 
                                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white' 
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          }`}
                                        >
                                          {isClaiming ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                              Réclamation...
                                            </>
                                          ) : canAfford ? (
                                            <>
                                              <GiftIcon className="w-4 h-4 mr-2" />
                                              Réclamer
                                            </>
                                          ) : (
                                            <>
                                              <StarIcon className="w-4 h-4 mr-2" />
                                              Il te faut {reward.cost - child.points} points de plus
                                            </>
                                          )}
                                        </Button>
                                        
                                        {!canAfford && (
                                          <div className="text-xs text-gray-500 text-center">
                                            Tu as {child.points} points, il en faut {reward.cost}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Récompenses réclamées */}
                          {claimedRewards.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                Récompenses réclamées ({claimedRewards.length})
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {claimedRewards.map((rewardId) => {
                                  const reward = rewards.find(r => r.id === rewardId);
                                  if (!reward) return null;
                                  
                                  return (
                                    <motion.div
                                      key={rewardId}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-green-100 text-green-600">
                                          <CheckCircleIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-gray-800">{reward.label}</h4>
                                          <p className="text-sm text-gray-600">{reward.cost} points</p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🎁</div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune récompense disponible</h3>
                          <p className="text-gray-600 mb-4">Demande à tes parents d'ajouter des récompenses !</p>
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
                            <p className="text-sm text-gray-600">
                              💡 <strong>Conseil :</strong> Complète tes missions pour gagner des points et débloquer des récompenses !
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Onglet Boutique */}
              {activeTab === 'shop' && (
                <div className="space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <ShoppingCartIcon className="w-8 h-8 text-green-600" />
                        Boutique
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const piggyStats = getPiggyBankStats();
                        const totalAvailablePoints = child.points + piggyStats.currentBalance;
                        
                        return (
                          <div className="space-y-6">
                            {/* Informations sur les points */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                                <div className="text-2xl font-bold text-yellow-600">{child.points}</div>
                                <div className="text-sm text-gray-600">Points disponibles</div>
                                <div className="text-xs text-yellow-500 mt-1">≈ {convertPointsToEuros(child.points)} €</div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200 text-center">
                                <div className="text-2xl font-bold text-green-600">{piggyStats.currentBalance}</div>
                                <div className="text-sm text-gray-600">Points épargnés</div>
                                <div className="text-xs text-green-500 mt-1">≈ {convertPointsToEuros(piggyStats.currentBalance)} €</div>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 text-center">
                                <div className="text-2xl font-bold text-purple-600">{totalAvailablePoints}</div>
                                <div className="text-sm text-gray-600">Total disponible</div>
                                <div className="text-xs text-purple-500 mt-1">≈ {convertPointsToEuros(totalAvailablePoints)} €</div>
                              </div>
                            </div>

                            {shopLoading ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 3 }).map((_, index) => (
                                  <div key={index} className="bg-gray-100 rounded-2xl p-6 animate-pulse">
                                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                  </div>
                                ))}
                              </div>
                            ) : shopItems.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {shopItems.map((item) => {
                                  const canAffordWithPoints = child.points >= item.price;
                                  const canAffordWithPiggy = piggyStats.currentBalance >= item.price;
                                  const canAffordTotal = totalAvailablePoints >= item.price;
                                  
                                  return (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg"
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <ShoppingCartIcon className="w-8 h-8 text-green-600" />
                                        <Badge className="bg-green-100 text-green-800">
                                          {item.price} points
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-500 mb-2 text-center">≈ {convertPointsToEuros(item.price)} €</div>
                                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
                                      <p className="text-gray-600 mb-4">Article disponible en boutique</p>
                                      
                                      {/* Indicateur de source de points */}
                                      {canAffordTotal && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                          <p className="text-sm text-blue-700 font-medium mb-1">Paiement possible avec :</p>
                                          <div className="space-y-1">
                                            {canAffordWithPoints && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <StarIcon className="w-4 h-4 text-yellow-600" />
                                                <span>Points disponibles ({child.points})</span>
                                              </div>
                                            )}
                                            {canAffordWithPiggy && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <PiggyBankIcon className="w-4 h-4 text-green-600" />
                                                <span>Points épargnés ({piggyStats.currentBalance})</span>
                                              </div>
                                            )}
                                            {!canAffordWithPoints && !canAffordWithPiggy && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <span className="text-purple-600">Combinaison des deux sources</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <Button
                                        onClick={() => {
                                          setSelectedShopItem(item);
                                          setShowShopDialog(true);
                                        }}
                                        disabled={!canAffordTotal}
                                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                                      >
                                        <ShoppingCartIcon className="w-4 h-4 mr-2" />
                                        {canAffordTotal ? 'Acheter' : 'Points insuffisants'}
                                      </Button>
                                      
                                      {!canAffordTotal && (
                                        <div className="text-xs text-gray-500 text-center mt-2">
                                          Il te faut {item.price - totalAvailablePoints} points de plus
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <div className="text-6xl mb-4">🛒</div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Boutique vide !</h3>
                                <p className="text-gray-600">Demande à tes parents d'ajouter des articles à la boutique.</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Onglet Tirelire */}
              {activeTab === 'piggy' && (
                <div className="space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <PiggyBankIcon className="w-8 h-8 text-orange-600" />
                        Ma Tirelire
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getPiggyBankStats();
                        return (
                          <div className="space-y-6">
                            {/* Statistiques principales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200 text-center">
                                <div className="text-2xl font-bold text-orange-600">{stats.currentBalance}</div>
                                <div className="text-sm text-gray-600">Solde actuel</div>
                                <div className="text-xs text-orange-500 mt-1">≈ {convertPointsToEuros(stats.currentBalance)} €</div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200 text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.totalSavings}</div>
                                <div className="text-sm text-gray-600">Total épargné</div>
                                <div className="text-xs text-green-500 mt-1">≈ {convertPointsToEuros(stats.totalSavings)} €</div>
                              </div>
                              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200 text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.totalSpending}</div>
                                <div className="text-sm text-gray-600">Total dépensé</div>
                                <div className="text-xs text-red-500 mt-1">≈ {convertPointsToEuros(stats.totalSpending)} €</div>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.transactionCount}</div>
                                <div className="text-sm text-gray-600">Transactions</div>
                              </div>
                            </div>

                            {/* Section de dépôt */}
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <PiggyBankIcon className="w-5 h-5 text-orange-600" />
                                Déposer des points
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="piggy-amount">Montant à déposer</Label>
                                  <Input
                                    id="piggy-amount"
                                    type="number"
                                    value={piggyAmount}
                                    onChange={(e) => setPiggyAmount(e.target.value)}
                                    placeholder="Points à déposer"
                                    max={child.points}
                                    disabled={depositing}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Points disponibles : {child.points}
                                  </p>
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    onClick={() => setShowPiggyDialog(true)}
                                    disabled={!piggyAmount || parseInt(piggyAmount) <= 0 || parseInt(piggyAmount) > child.points || depositing}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                                  >
                                    {depositing ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Dépôt en cours...
                                      </>
                                    ) : (
                                      <>
                                        <PiggyBankIcon className="w-4 h-4 mr-2" />
                                        Déposer
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Section de retrait */}
                            {(() => {
                              const stats = getPiggyBankStats();
                              if (stats.currentBalance > 0) {
                                return (
                                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                      <Minus className="w-5 h-5 text-blue-600" />
                                      Retirer des points
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="piggy-withdraw-amount">Montant à retirer</Label>
                                        <Input
                                          id="piggy-withdraw-amount"
                                          type="number"
                                          value={piggyWithdrawAmount}
                                          onChange={(e) => setPiggyWithdrawAmount(e.target.value)}
                                          placeholder="Points à retirer"
                                          max={stats.currentBalance}
                                          disabled={depositing}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          Solde épargné : {stats.currentBalance}
                                        </p>
                                      </div>
                                      <div className="flex items-end">
                                        <Button
                                          onClick={() => setShowPiggyWithdrawDialog(true)}
                                          disabled={!piggyWithdrawAmount || parseInt(piggyWithdrawAmount) <= 0 || parseInt(piggyWithdrawAmount) > stats.currentBalance || depositing}
                                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                                        >
                                          {depositing ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                              Retrait en cours...
                                            </>
                                          ) : (
                                            <>
                                              <Minus className="w-4 h-4 mr-2" />
                                              Retirer
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Historique des transactions */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-purple-600" />
                                Historique des transactions
                              </h4>
                              {piggyLoading ? (
                                <div className="space-y-4">
                                  {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                  ))}
                                </div>
                              ) : piggyTransactions.length > 0 ? (
                                <div className="space-y-3">
                                  {piggyTransactions.map((transaction) => (
                                    <motion.div
                                      key={transaction.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                                        transaction.type === 'savings' 
                                          ? 'bg-green-50 border-green-200' 
                                          : transaction.type === 'spending'
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-blue-50 border-blue-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                          transaction.type === 'savings' 
                                            ? 'bg-green-100 text-green-600' 
                                            : transaction.type === 'spending'
                                              ? 'bg-red-100 text-red-600'
                                              : 'bg-blue-100 text-blue-600'
                                        }`}>
                                          {transaction.type === 'savings' ? (
                                            <Plus className="w-4 h-4" />
                                          ) : transaction.type === 'spending' ? (
                                            <Minus className="w-4 h-4" />
                                          ) : (
                                            <HeartIcon className="w-4 h-4" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-800">
                                            {transaction.type === 'savings' ? 'Épargne' : 
                                             transaction.type === 'spending' ? 'Dépense' : 'Don'}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {format(new Date(transaction.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                          </p>
                                        </div>
                                      </div>
                                      <span className={`font-bold text-lg ${
                                        transaction.type === 'savings' 
                                          ? 'text-green-600' 
                                          : transaction.type === 'spending'
                                            ? 'text-red-600'
                                            : 'text-blue-600'
                                      }`}>
                                        {transaction.type === 'savings' ? '+' : '-'}{transaction.points} pts
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        ≈ {convertPointsToEuros(transaction.points)} €
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="text-6xl mb-4">🐷</div>
                                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune transaction</h3>
                                  <p className="text-gray-600">Commence à épargner tes points !</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Onglet Devinettes */}
              {activeTab === 'riddles' && (
                <div className="space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <BrainIcon className="w-8 h-8 text-purple-600" />
                        Devinette du Jour
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentRiddle ? (
                        <div className="text-center">
                          <div className="text-6xl mb-6">🧩</div>
                          <div className={`rounded-2xl p-8 border-2 mb-6 ${
                            riddleSolved 
                              ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200' 
                              : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                          }`}>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">{currentRiddle.question}</h3>
                            <p className="text-gray-600 mb-4">Récompense : {currentRiddle.points} points (≈ {convertPointsToEuros(currentRiddle.points)} €)</p>
                            
                            {/* Affichage de l'indice si acheté */}
                            {hintPurchased && !riddleSolved && (
                              <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">💡</span>
                                  <span className="font-semibold text-yellow-800">Indice acheté :</span>
                                </div>
                                <p className="text-yellow-700">{hintText}</p>
                              </div>
                            )}
                            
                            {riddleSolved ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                                  <CheckCircleIcon className="w-6 h-6" />
                                  <span>Bravo ! Tu as résolu la devinette d'aujourd'hui !</span>
                                </div>
                                <p className="text-gray-600">Reviens demain pour une nouvelle devinette !</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Button
                                  onClick={() => setShowRiddleDialog(true)}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                >
                                  <BrainIcon className="w-4 h-4 mr-2" />
                                  Répondre
                                </Button>
                                
                                {!hintPurchased ? (
                                  <Button
                                    onClick={purchaseHint}
                                    variant="outline"
                                    disabled={child.points < 5 || !currentRiddle?.hint}
                                    className={`border-purple-300 text-purple-600 hover:bg-purple-50 ${
                                      child.points < 5 || !currentRiddle?.hint ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                  >
                                    💡 Acheter un indice (5 points)
                                    {!currentRiddle?.hint && (
                                      <span className="ml-2 text-xs">(Non disponible)</span>
                                    )}
                                  </Button>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    ✅ Indice déjà acheté pour aujourd'hui
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🎉</div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Bravo !</h3>
                          <p className="text-gray-600">Tu as résolu toutes les devinettes d'aujourd'hui !</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Onglet Profil */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <UsersIcon className="w-8 h-8 text-pink-600" />
                        Mon Profil
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                          {child.avatar_url ? (
                            <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg mx-auto mb-4">
                              <img 
                                src={child.avatar_url} 
                                alt={`Photo de ${child.name}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // En cas d'erreur de chargement, afficher l'avatar par défaut
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div 
                                className={`w-full h-full flex items-center justify-center text-white text-4xl font-bold ${
                                  child.avatar_url ? 'hidden' : ''
                                }`}
                                style={{ backgroundColor: child.custom_color }}
                              >
                                {child.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mx-auto mb-4"
                              style={{ backgroundColor: child.custom_color }}
                            >
                              {child.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">{child.name}</h3>
                          <p className="text-gray-600 mb-4">{child.age} ans</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200">
                            <div className="flex items-center gap-3 mb-2">
                              <StarIcon className="w-6 h-6 text-yellow-600" />
                              <span className="font-semibold text-gray-800">Points actuels</span>
                            </div>
                            <div className="text-3xl font-bold text-yellow-600">{child.points}</div>
                            <div className="text-sm text-yellow-500 mt-1">≈ {convertPointsToEuros(child.points)} €</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 border-2 border-red-200">
                            <div className="flex items-center gap-3 mb-2">
                              <AwardIcon className="w-6 h-6 text-red-600" />
                              <span className="font-semibold text-gray-800">Série de jours</span>
                            </div>
                            <div className="text-3xl font-bold text-red-600">{streak} jours 🔥</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-4 border-2 border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                              <TargetIcon className="w-6 h-6 text-green-600" />
                              <span className="font-semibold text-gray-800">Missions complétées</span>
                            </div>
                            <div className="text-3xl font-bold text-green-600">{completedTasks}/{totalTasks}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Onglet Mes Achats */}
              {activeTab === 'purchases' && (
                <div className="space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <PackageIcon className="w-8 h-8 text-indigo-600" />
                        Mes Achats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getPurchaseStats();
                        return (
                          <div className="space-y-6">
                            {/* Statistiques des achats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200 text-center">
                                <div className="text-2xl font-bold text-indigo-600">{stats.totalPurchases}</div>
                                <div className="text-sm text-gray-600">Total des achats</div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200 text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.totalSpent}</div>
                                <div className="text-sm text-gray-600">Points dépensés</div>
                                <div className="text-xs text-green-500 mt-1">≈ {convertPointsToEuros(stats.totalSpent)} €</div>
                              </div>
                              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.uniqueItems}</div>
                                <div className="text-sm text-gray-600">Articles différents</div>
                              </div>
                              <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-4 border-2 border-pink-200 text-center">
                                <div className="text-2xl font-bold text-pink-600">
                                  {stats.totalPurchases > 0 ? Math.round(stats.totalSpent / stats.totalPurchases) : 0}
                                </div>
                                <div className="text-sm text-gray-600">Moyenne par achat</div>
                              </div>
                            </div>

                            {/* Historique des achats */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-purple-600" />
                                Historique des achats
                              </h4>
                              {purchasesLoading ? (
                                <div className="space-y-4">
                                  {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="bg-gray-100 rounded-xl p-4 animate-pulse">
                                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                  ))}
                                </div>
                              ) : purchases.length > 0 ? (
                                <div className="space-y-3">
                                  {purchases.map((purchase) => (
                                    <motion.div
                                      key={purchase.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200 shadow-sm"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                                            <PackageIcon className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-gray-800">
                                              {purchase.item?.name || 'Article supprimé'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                              {format(new Date(purchase.purchased_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="flex items-center gap-1 text-indigo-600 font-bold">
                                            <StarIcon className="w-4 h-4" />
                                            <span>{purchase.item?.price || 0} pts</span>
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            ≈ {convertPointsToEuros(purchase.item?.price || 0)} €
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            Achat #{purchase.id.slice(0, 8)}
                                          </p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <div className="text-6xl mb-4">📦</div>
                                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucun achat</h3>
                                  <p className="text-gray-600 mb-4">Tu n'as pas encore acheté d'articles !</p>
                                  <Button
                                    onClick={() => setActiveTab('shop')}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                                  >
                                    <ShoppingCartIcon className="w-4 h-4 mr-2" />
                                    Aller à la boutique
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Statistiques mensuelles */}
                            {Object.keys(stats.monthlyStats).length > 0 && (
                              <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                  Statistiques mensuelles
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(stats.monthlyStats)
                                    .sort(([a], [b]) => b.localeCompare(a))
                                    .slice(0, 6)
                                    .map(([month, data]) => {
                                      const [year, monthNum] = month.split('-');
                                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                                      
                                      return (
                                        <div key={month} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 border-2 border-blue-200">
                                          <h5 className="font-semibold text-gray-800 mb-2">{monthName}</h5>
                                          <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                              <span className="text-gray-600">Achats :</span>
                                              <span className="font-medium">{data.count}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                              <span className="text-gray-600">Points :</span>
                                              <span className="font-medium text-green-600">{data.total}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                              <span className="text-gray-500">Valeur :</span>
                                              <span className="text-green-500">≈ {convertPointsToEuros(data.total)} €</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

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

      {/* Indicateurs flottants fixes en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-purple-200 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            {/* Missions non complétées */}
            <div className="relative group">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                onClick={() => setActiveTab('tasks')}
              >
                <TargetIcon className="w-6 h-6" />
              </div>
              {(() => {
                const incompleteTasks = childTasks.filter(t => !t.is_completed);
                if (incompleteTasks.length > 0) {
                  return (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-blue-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse"
                    >
                      {incompleteTasks.length}
                    </motion.div>
                  );
                }
                return null;
              })()}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {(() => {
                  const incompleteTasks = childTasks.filter(t => !t.is_completed);
                  return incompleteTasks.length > 0 
                    ? `${incompleteTasks.length} mission${incompleteTasks.length > 1 ? 's' : ''} à accomplir`
                    : 'Toutes les missions sont accomplies !';
                })()}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Récompenses disponibles */}
            <div className="relative group">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                onClick={() => setActiveTab('rewards')}
              >
                <TrophyIcon className="w-6 h-6" />
              </div>
              {(() => {
                const piggyStats = getPiggyBankStats();
                const totalAvailablePoints = child.points + piggyStats.currentBalance;
                const affordableRewards = rewards.filter(r => totalAvailablePoints >= r.cost && !isRewardClaimed(r.id));
                const totalUnclaimedRewards = rewards.filter(r => !isRewardClaimed(r.id));
                
                if (affordableRewards.length > 0) {
                  return (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse"
                    >
                      {affordableRewards.length}
                    </motion.div>
                  );
                } else if (totalUnclaimedRewards.length > 0) {
                  return (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-orange-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    >
                      {totalUnclaimedRewards.length}
                    </motion.div>
                  );
                }
                return null;
              })()}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {(() => {
                  const piggyStats = getPiggyBankStats();
                  const totalAvailablePoints = child.points + piggyStats.currentBalance;
                  const affordableRewards = rewards.filter(r => totalAvailablePoints >= r.cost && !isRewardClaimed(r.id));
                  const totalRewards = rewards.filter(r => !isRewardClaimed(r.id));
                  
                  if (affordableRewards.length > 0) {
                    return `${affordableRewards.length} récompense${affordableRewards.length > 1 ? 's' : ''} disponible${affordableRewards.length > 1 ? 's' : ''}`;
                  } else if (totalRewards.length > 0) {
                    return `${totalRewards.length} récompense${totalRewards.length > 1 ? 's' : ''} (points insuffisants)`;
                  } else {
                    return 'Aucune récompense disponible';
                  }
                })()}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Produits en boutique */}
            <div className="relative group">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                onClick={() => setActiveTab('shop')}
              >
                <ShoppingCartIcon className="w-6 h-6" />
              </div>
              {shopItems.length > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-blue-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold"
                >
                  {shopItems.length}
                </motion.div>
              )}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {shopItems.length > 0 
                  ? `${shopItems.length} produit${shopItems.length > 1 ? 's' : ''} en boutique`
                  : 'Boutique vide'
                }
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Devinette du jour */}
            <div className="relative group">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                onClick={() => setActiveTab('riddles')}
              >
                <BrainIcon className="w-6 h-6" />
              </div>
              {currentRiddle && !riddleSolved && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-purple-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce"
                >
                  !
                </motion.div>
              )}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {currentRiddle && !riddleSolved 
                  ? 'Nouvelle devinette disponible !'
                  : riddleSolved 
                    ? 'Devinette résolue aujourd\'hui'
                    : 'Aucune devinette disponible'
                }
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 