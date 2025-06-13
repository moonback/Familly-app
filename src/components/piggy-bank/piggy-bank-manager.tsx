import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PiggyBankIcon, Plus, Minus, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Child, PiggyBankTransaction } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface PiggyBankManagerProps {
  child: Child | null;
  onPointsUpdated: () => void;
  className?: string;
}

export function PiggyBankManager({ child, onPointsUpdated }: PiggyBankManagerProps) {
  const [transactions, setTransactions] = useState<PiggyBankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ type: 'savings' as 'savings' | 'spending' | 'donation', points: '' });
  const [euros, setEuros] = useState('');
  const [points, setPoints] = useState('');
  const [convertedValue, setConvertedValue] = useState<number | null>(null);
  const [converterType, setConverterType] = useState<'euro' | 'points' | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <Card className="bg-white/90 backdrop-blur-md shadow-xl border-0 rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
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
      <CardContent className="p-6">
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
          className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Convertisseur Euro/Points</h3>
          <p className="text-sm text-blue-700 mb-4">Taux de conversion: 1€ = {CONVERSION_RATE} points</p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                type="number"
                placeholder="Euros"
                value={euros}
                onChange={handleEuroChange}
                className="bg-white flex-1"
              />
              <Button onClick={convertEuroToPoints} className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
                Convertir en Points
              </Button>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                type="number"
                placeholder="Points"
                value={points}
                onChange={handlePointsChange}
                className="bg-white flex-1"
              />
              <Button onClick={convertPointsToEuro} className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
                Convertir en Euros
              </Button>
            </div>
            {convertedValue !== null && (converterType === 'points' ? (
              <p className="text-lg font-bold text-blue-800 mt-2">{convertedValue} points</p>
            ) : (
              <p className="text-lg font-bold text-blue-800 mt-2">{convertedValue.toFixed(2)} €</p>
            ))}
          </div>
        </motion.div>
        {/* Convertisseur Euro/Points - Fin */}

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Historique des transactions</h3>
          <AnimatePresence>
            {transactions.map((t, index) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-xl border ${getTransactionColor(t.type)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/50 rounded-lg">
                    {getTransactionIcon(t.type)}
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {t.type === 'savings' ? 'Épargne' : t.type === 'spending' ? 'Dépense' : 'Don'}
                    </p>
                    <p className="text-sm opacity-75">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <span className="font-bold">{t.points} pts</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {transactions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              Aucune transaction
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
