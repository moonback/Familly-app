import { useAuth } from '@/context/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrophyIcon, 
  StarIcon, 
  GiftIcon, 
  BrainIcon, 
  PiggyBankIcon,
  ShoppingCartIcon,
  SettingsIcon,
  HomeIcon,
  BookOpenIcon,
  HeartIcon,
  TargetIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  UsersIcon,
  AwardIcon,
  CoinsIcon,
  PuzzleIcon,
  MusicIcon,
  PaintbrushIcon,
  GamepadIcon,
  BookIcon,
  CalculatorIcon,
  GlobeIcon,
  MicroscopeIcon,
  PaletteIcon,
  CameraIcon,
  BikeIcon,
  
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'shop' | 'piggy' | 'riddles' | 'profile'>('tasks');
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [showRiddleDialog, setShowRiddleDialog] = useState(false);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [showShopDialog, setShowShopDialog] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null);
  const [showPiggyDialog, setShowPiggyDialog] = useState(false);
  const [piggyAmount, setPiggyAmount] = useState('');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = useState(true);

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
  const { rewards, claimedRewards, claimReward, claiming, isRewardClaimed } = useRewards(child, fetchChildData);
  const { currentRiddle, riddleSolved, showSuccess, hintPurchased, hintText, submitRiddleAnswer, purchaseHint } = useRiddles(child, fetchChildData);
  const { streak } = useStreak(child);
  const { pointsHistory } = usePointsHistory(child);

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
        const { error } = await supabase
          .from('purchases')
          .insert([{
            child_id: child.id,
            item_id: selectedShopItem.id,
            purchased_at: new Date().toISOString()
          }]);

        if (error) throw error;

        // Mettre à jour les points de l'enfant
        const { error: updateError } = await supabase
          .from('children')
          .update({ points: child.points - selectedShopItem.price })
          .eq('id', child.id);

        if (updateError) throw updateError;

        toast({
          title: 'Achat réussi !',
          description: `Tu as acheté ${selectedShopItem.name} !`,
        });

        setShowShopDialog(false);
        setSelectedShopItem(null);
        fetchChildData();
      } catch (error) {
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
      if (amount > 0 && amount <= child.points) {
        try {
          const { error } = await supabase
            .from('piggy_bank_transactions')
            .insert([{
              child_id: child.id,
              amount: amount,
              transaction_type: 'deposit',
              created_at: new Date().toISOString()
            }]);

          if (error) throw error;

          // Mettre à jour les points de l'enfant
          const { error: updateError } = await supabase
            .from('children')
            .update({ points: child.points - amount })
            .eq('id', child.id);

          if (updateError) throw updateError;

          toast({
            title: 'Dépôt réussi !',
            description: `${amount} points ajoutés à ta tirelire !`,
          });

          setShowPiggyDialog(false);
          setPiggyAmount('');
          fetchChildData();
        } catch (error) {
          toast({
            title: 'Erreur',
            description: "Impossible d'effectuer le dépôt",
            variant: 'destructive',
          });
        }
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

  if (loading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-purple-600 font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || !child) {
    return null;
  }

  const totalTasks = childTasks.length;
  const completedTasks = childTasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const tabs = [
    { id: 'tasks', label: 'Mes Missions', icon: TargetIcon, color: 'text-blue-600' },
    { id: 'rewards', label: 'Mes Récompenses', icon: TrophyIcon, color: 'text-yellow-600' },
    { id: 'shop', label: 'Boutique', icon: ShoppingCartIcon, color: 'text-green-600' },
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
        className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-50"
      >
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {child.avatar_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg">
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
                    className={`w-full h-full flex items-center justify-center text-white text-2xl font-bold ${
                      child.avatar_url ? 'hidden' : ''
                    }`}
                    style={{ backgroundColor: child.custom_color }}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  style={{ backgroundColor: child.custom_color }}
                >
                  {child.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Salut {child.name} ! 👋</h1>
                <p className="text-gray-600">Prêt pour de nouvelles aventures ?</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                <StarIcon className="inline-block w-5 h-5 mr-2" />
                {child.points} points
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="bg-white/50 hover:bg-white/80"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation par onglets */}
      <div className="container mx-auto p-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-6 shadow-lg">
          <div className="grid grid-cols-6 gap-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <TrophyIcon className="w-8 h-8 text-yellow-600" />
                      Mes Récompenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rewards.length > 0 ? (
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
                              className={`rounded-2xl p-6 border-2 shadow-lg ${
                                isClaimed 
                                  ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200' 
                                  : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <GiftIcon className={`w-8 h-8 ${isClaimed ? 'text-green-600' : 'text-yellow-600'}`} />
                                <Badge className={`${
                                  isClaimed 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {reward.cost} points
                                </Badge>
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
                                    'Points insuffisants'
                                  )}
                                </Button>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎁</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune récompense disponible</h3>
                        <p className="text-gray-600">Demande à tes parents d'ajouter des récompenses !</p>
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
                        {shopItems.map((item) => (
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
                            <p className="text-gray-600 mb-4">Article disponible en boutique</p>
                            <Button
                              onClick={() => {
                                setSelectedShopItem(item);
                                setShowShopDialog(true);
                              }}
                              disabled={child.points < item.price}
                              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                            >
                              <ShoppingCartIcon className="w-4 h-4 mr-2" />
                              {child.points >= item.price ? 'Acheter' : 'Points insuffisants'}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🛒</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Boutique vide !</h3>
                        <p className="text-gray-600">Demande à tes parents d'ajouter des articles à la boutique.</p>
                      </div>
                    )}
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
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">🐷</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Épargne tes points !</h3>
                      <p className="text-gray-600">Garde tes points pour des achats plus importants</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Déposer des points</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="piggy-amount">Montant à déposer</Label>
                            <Input
                              id="piggy-amount"
                              type="number"
                              value={piggyAmount}
                              onChange={(e) => setPiggyAmount(e.target.value)}
                              placeholder="Points à déposer"
                              max={child.points}
                            />
                          </div>
                          <Button
                            onClick={() => setShowPiggyDialog(true)}
                            disabled={!piggyAmount || parseInt(piggyAmount) <= 0 || parseInt(piggyAmount) > child.points}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                          >
                            <PiggyBankIcon className="w-4 h-4 mr-2" />
                            Déposer
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Statistiques</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Points disponibles :</span>
                            <span className="font-bold text-blue-600">{child.points}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total épargné :</span>
                            <span className="font-bold text-purple-600">0</span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                          <p className="text-gray-600 mb-4">Récompense : {currentRiddle.points} points</p>
                          
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
          </motion.div>
        </AnimatePresence>
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
            {selectedShopItem && (
              <>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-2">{selectedShopItem.name}</h3>
                  <p className="text-gray-600 mb-2">Article disponible en boutique</p>
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-4 h-4 text-yellow-600" />
                    <span className="font-bold text-yellow-600">{selectedShopItem.price} points</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleShopPurchase}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  >
                    Acheter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowShopDialog(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </>
            )}
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
    </div>
  );
} 