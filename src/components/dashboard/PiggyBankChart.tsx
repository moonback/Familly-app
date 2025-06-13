import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBankIcon, Plus, Minus, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PiggyBankData {
  date: string;
  savings: number;
  spending: number;
  donation: number;
}

type Period = 'day' | 'week' | 'month';

interface PiggyBankChartProps {
  data: PiggyBankData[];
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export const PiggyBankChart = ({ data, period, onPeriodChange }: PiggyBankChartProps) => {
  const totalSavings = data.reduce((sum, day) => sum + (day.savings || 0), 0);
  const totalSpending = data.reduce((sum, day) => sum + (day.spending || 0), 0);
  const totalDonation = data.reduce((sum, day) => sum + (day.donation || 0), 0);

  return (
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
            <Select value={period} onValueChange={onPeriodChange}>
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
              {totalSavings} pts
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
              {totalSpending} pts
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
              {totalDonation} pts
            </p>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
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
              <Tooltip 
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
  );
}; 