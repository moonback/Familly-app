import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { 
  CheckCircle, 
  Clock, 
  Trophy, 
  Star, 
  Users, 
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface ChildRewardClaimed {
  id: string;
  child_id: string;
  reward_id: string;
  claimed_at: string;
  created_at: string;
  is_validated: boolean;
  validated_at?: string;
  validated_by?: string;
  child: {
    id: string;
    name: string;
    avatar_url?: string;
    custom_color: string;
  };
  reward: {
    id: string;
    label: string;
    cost: number;
  };
}

export function RewardsValidationManager() {
  const { user } = useAuth();
  const [claimedRewards, setClaimedRewards] = useState<ChildRewardClaimed[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchClaimedRewards();
    }
  }, [user]);

  const fetchClaimedRewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('claimed_rewards')
        .select(`
          *,
          child:children (
            id,
            name,
            avatar_url,
            custom_color
          ),
          reward:rewards (
            id,
            label,
            cost
          )
        `)
        .eq('child.user_id', user?.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      setClaimedRewards(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des récompenses réclamées:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les récompenses réclamées",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateReward = async (claimedRewardId: string) => {
    try {
      setValidating(claimedRewardId);
      const { error } = await supabase
        .from('claimed_rewards')
        .update({
          is_validated: true,
          validated_at: new Date().toISOString(),
          validated_by: user?.id
        })
        .eq('id', claimedRewardId);

      if (error) throw error;

      toast({
        title: '✅ Récompense validée !',
        description: "La récompense a été marquée comme effectuée",
      });

      // Mettre à jour la liste
      setClaimedRewards(prev => 
        prev.map(reward => 
          reward.id === claimedRewardId 
            ? { 
                ...reward, 
                is_validated: true, 
                validated_at: new Date().toISOString(),
                validated_by: user?.id
              }
            : reward
        )
      );
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de valider la récompense",
        variant: 'destructive',
      });
    } finally {
      setValidating(null);
    }
  };

  const unvalidateReward = async (claimedRewardId: string) => {
    try {
      setValidating(claimedRewardId);
      const { error } = await supabase
        .from('claimed_rewards')
        .update({
          is_validated: false,
          validated_at: null,
          validated_by: null
        })
        .eq('id', claimedRewardId);

      if (error) throw error;

      toast({
        title: '🔄 Validation annulée',
        description: "La récompense a été marquée comme non effectuée",
      });

      // Mettre à jour la liste
      setClaimedRewards(prev => 
        prev.map(reward => 
          reward.id === claimedRewardId 
            ? { 
                ...reward, 
                is_validated: false, 
                validated_at: undefined,
                validated_by: undefined
              }
            : reward
        )
      );
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la validation:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'annuler la validation",
        variant: 'destructive',
      });
    } finally {
      setValidating(null);
    }
  };

  const pendingRewards = claimedRewards.filter(reward => !reward.is_validated);
  const validatedRewards = claimedRewards.filter(reward => reward.is_validated);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total réclamées</p>
                <p className="text-2xl font-bold text-blue-700">{claimedRewards.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">En attente</p>
                <p className="text-2xl font-bold text-orange-700">{pendingRewards.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Validées</p>
                <p className="text-2xl font-bold text-green-700">{validatedRewards.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Récompenses en attente de validation */}
      {pendingRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="w-5 h-5" />
              Récompenses en attente de validation ({pendingRewards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {pendingRewards.map((claimedReward) => (
                  <motion.div
                    key={claimedReward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar de l'enfant */}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          style={{ backgroundColor: claimedReward.child.custom_color }}
                        >
                          {claimedReward.child.avatar_url ? (
                            <img 
                              src={claimedReward.child.avatar_url} 
                              alt={claimedReward.child.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            claimedReward.child.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Informations de la récompense */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{claimedReward.reward.label}</h4>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              {claimedReward.reward.cost} pts
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Réclamée par <span className="font-medium">{claimedReward.child.name}</span> le{' '}
                            {format(new Date(claimedReward.claimed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => validateReward(claimedReward.id)}
                          disabled={validating === claimedReward.id}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          size="sm"
                        >
                          {validating === claimedReward.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Valider
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Récompenses validées */}
      {validatedRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Récompenses validées ({validatedRewards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {validatedRewards.map((claimedReward) => (
                  <motion.div
                    key={claimedReward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar de l'enfant */}
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          style={{ backgroundColor: claimedReward.child.custom_color }}
                        >
                          {claimedReward.child.avatar_url ? (
                            <img 
                              src={claimedReward.child.avatar_url} 
                              alt={claimedReward.child.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            claimedReward.child.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Informations de la récompense */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{claimedReward.reward.label}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {claimedReward.reward.cost} pts
                            </Badge>
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Validée
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Réclamée par <span className="font-medium">{claimedReward.child.name}</span> le{' '}
                            {format(new Date(claimedReward.claimed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </p>
                          {claimedReward.validated_at && (
                            <p className="text-xs text-green-600 mt-1">
                              ✅ Validée le {format(new Date(claimedReward.validated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bouton pour annuler la validation */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => unvalidateReward(claimedReward.id)}
                          disabled={validating === claimedReward.id}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          {validating === claimedReward.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              Annuler
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucune récompense */}
      {claimedRewards.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune récompense réclamée</h3>
            <p className="text-gray-500">
              Les récompenses réclamées par vos enfants apparaîtront ici pour validation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 