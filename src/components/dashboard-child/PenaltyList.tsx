import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PenaltyHistory {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

interface PenaltyListProps {
  penalties: PenaltyHistory[];
}

export function PenaltyList({ penalties }: PenaltyListProps) {
  if (penalties.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, delay: 0.8 }}
      className="md:col-span-12 lg:col-span-12 mt-8"
    >
      <Card className="shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-300">
        <CardHeader className="relative">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)]" />
          <CardTitle className="relative z-10 text-3xl font-bold text-gray-800 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" />
            Mes Pénalités
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {penalties.map(penalty => (
              <motion.div
                key={penalty.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-6 rounded-xl border-2 bg-red-50/50 border-red-100 hover:border-red-200 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-red-100">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">{penalty.reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {format(new Date(penalty.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-500">-{Math.abs(penalty.points)} points</p>
                  <p className="text-sm text-gray-500">Points retirés</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
