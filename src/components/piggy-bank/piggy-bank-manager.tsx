import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PiggyBankIcon, Plus, Minus, Heart, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Child, PiggyBankTransaction } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PiggyBankManagerProps {
  child: Child | null;
  onPointsUpdated: () => void;
  className?: string;
}

export function PiggyBankManager({ child, onPointsUpdated }: PiggyBankManagerProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PiggyBankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ type: 'savings' as 'savings' | 'spending' | 'donation', points: '' });
  const [euros, setEuros] = useState('');
  const [points, setPoints] = useState('');
  const [convertedValue, setConvertedValue] = useState<number | null>(null);
  const [converterType, setConverterType] = useState<'euro' | 'points' | null>(null);
  const [showParentCodeDialog, setShowParentCodeDialog] = useState(false);
  const [parentCode, setParentCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const CONVERSION_RATE = 100; // 1€ = 100 points

  useEffect(() => {
    if (child) {
      fetchTransactions();
    }
  }, [child]);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('piggy_bank_transactions')
      .select('*')
      .eq('child_id', child?.id)
      .order('created_at', { ascending: false });
    if (!error) setTransactions(data || []);
    setLoading(false);
  };

  const verifyParentCode = async () => {
    if (!user?.id) return;
    setIsVerifying(true);

    try {
      const { data: parentCodeData, error } = await supabase
        .from('parent_codes')
        .select('code')
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de vérifier le code parental.",
          variant: "destructive",
        });
        return false;
      }

      if (parentCodeData.code !== parentCode) {
        toast({
          title: "Erreur",
          description: "Code parental incorrect.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;

    // Si c'est une transaction d'épargne, vérifier le code parental
    if (formData.type === 'savings') {
      setShowParentCodeDialog(true);
      return;
    }

    await processTransaction();
  };

  const processTransaction = async () => {
    if (!child) return;
    const pointsValue = parseInt(formData.points);
    if (isNaN(pointsValue) || pointsValue <= 0) return;

    const { error } = await supabase.from('piggy_bank_transactions').insert([
      { child_id: child.id, type: formData.type, points: pointsValue, created_at: new Date().toISOString() }
    ]);

    if (error) {
      toast({ title: 'Erreur', description: "Impossible d'enregistrer la transaction", variant: 'destructive' });
      return;
    }

    const newPoints = formData.type === 'savings' ? child.points + pointsValue : child.points - pointsValue;
    const { error: updateError } = await supabase
      .from('children')
      .update({ points: newPoints })
      .eq('id', child.id);

    if (updateError) {
      toast({ title: 'Erreur', description: "Impossible de mettre à jour les points", variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Transaction ajoutée' });
      setFormData({ type: 'savings', points: '' });
      fetchTransactions();
      onPointsUpdated();
    }
  };

  const handleParentCodeSubmit = async () => {
    const isValid = await verifyParentCode();
    if (isValid) {
      setShowParentCodeDialog(false);
      setParentCode('');
      await processTransaction();
    }
  };

  const handleEuroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEuros(value);
    if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      setPoints((parseFloat(value) * CONVERSION_RATE).toString());
      setConvertedValue(null);
    } else {
      setPoints('');
    }
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPoints(value);
    if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      setEuros((parseFloat(value) / CONVERSION_RATE).toString());
      setConvertedValue(null);
    } else {
      setEuros('');
    }
  };

  const convertEuroToPoints = () => {
    const euroValue = parseFloat(euros);
    if (!isNaN(euroValue) && euroValue > 0) {
      setConvertedValue(euroValue * CONVERSION_RATE);
      setConverterType('points');
    } else {
      setConvertedValue(null);
      setConverterType(null);
    }
  };

  const convertPointsToEuro = () => {
    const pointsValue = parseFloat(points);
    if (!isNaN(pointsValue) && pointsValue > 0) {
      setConvertedValue(pointsValue / CONVERSION_RATE);
      setConverterType('euro');
    } else {
      setConvertedValue(null);
      setConverterType(null);
    }
  };

  if (loading) return <div>Chargement...</div>;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'spending':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'donation':
        return <Heart className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'spending':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'donation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return '';
    }
  };

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-md shadow-xl border-0 rounded-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-10 group-hover:opacity-15 transition-opacity duration-300" />
        <CardHeader className="relative z-10 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <PiggyBankIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Tirelire</CardTitle>
                <p className="text-purple-100 text-sm">Gérez les transactions de {child?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">Solde actuel</p>
              <p className="text-2xl font-bold">{child?.points || 0} pts</p>
              <p className="text-sm text-purple-100">~{((child?.points || 0) / CONVERSION_RATE).toFixed(2)} €</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-6">
          <motion.form 
            onSubmit={handleSubmit} 
            className="flex gap-3 mb-6 p-4 bg-gray-50 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value as 'savings' | 'spending' | 'donation' })}
            >
              <SelectTrigger className="w-32 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="savings">Épargne</SelectItem>
                <SelectItem value="spending">Dépense</SelectItem>
                <SelectItem value="donation">Don</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              type="number" 
              placeholder="Points" 
              value={formData.points} 
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              className="bg-white flex-1"
            />
            <Button 
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white flex-shrink-0"
            >
              Ajouter
            </Button>
          </motion.form>

          {/* Convertisseur Euro/Points - Début */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-md"
          >
            <h3 className="text-xl font-bold text-blue-800 mb-3">Convertisseur Euro/Points</h3>
            <p className="text-sm text-blue-700 mb-4">Taux de conversion: 1€ = {CONVERSION_RATE} points</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Euros"
                  value={euros}
                  onChange={handleEuroChange}
                  className="bg-white text-lg p-3 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500"
                />
                <Button 
                  onClick={convertEuroToPoints} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 rounded-lg shadow"
                >
                  Convertir en Points
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Points"
                  value={points}
                  onChange={handlePointsChange}
                  className="bg-white text-lg p-3 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500"
                />
                <Button 
                  onClick={convertPointsToEuro} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 rounded-lg shadow"
                >
                  Convertir en Euros
                </Button>
              </div>
            </div>
            {convertedValue !== null && (converterType === 'points' ? (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-blue-800 mt-4 text-center p-3 bg-blue-100 rounded-lg"
              >
                {convertedValue} points
              </motion.p>
            ) : (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-blue-800 mt-4 text-center p-3 bg-blue-100 rounded-lg"
              >
                {convertedValue.toFixed(2)} €
              </motion.p>
            ))}
          </motion.div>
          {/* Convertisseur Euro/Points - Fin */}

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Historique des transactions</h3>
            <AnimatePresence>
              {transactions.length > 0 ? (
                transactions.map((t, index) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-5 rounded-xl border-2 shadow-sm ${
                      getTransactionColor(t.type)
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-white/50 shadow-inner">
                        {getTransactionIcon(t.type)}
                      </div>
                      <div>
                        <p className="font-semibold capitalize text-lg">
                          {t.type === 'savings' ? 'Épargne' : t.type === 'spending' ? 'Dépense' : 'Don'}
                        </p>
                        <p className="text-sm opacity-80 text-gray-600">{new Date(t.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className="font-bold text-xl">
                      {t.type === 'savings' ? '+' : '-'}{Math.abs(t.points)} pts
                    </span>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-500"
                >
                  <div className="text-6xl mb-4">💸</div>
                  <p className="text-xl">Aucune transaction enregistrée.</p>
                  <p className="text-base mt-2">Commencez à gérer votre tirelire !</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showParentCodeDialog} onOpenChange={setShowParentCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              Vérification du Code Parent
            </DialogTitle>
            <DialogDescription>
              Veuillez entrer votre code parental pour confirmer la transaction d'épargne.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Code parental (4 chiffres)"
              value={parentCode}
              onChange={(e) => setParentCode(e.target.value)}
              maxLength={4}
              className="text-center text-lg tracking-widest"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowParentCodeDialog(false);
                  setParentCode('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleParentCodeSubmit}
                disabled={isVerifying || parentCode.length !== 4}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isVerifying ? "Vérification..." : "Confirmer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
