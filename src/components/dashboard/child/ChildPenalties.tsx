import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface Penalty {
  id: string;
  title: string;
  description: string;
  points_deduction: number;
  child_id: string;
  created_at: string;
  is_active: boolean;
  completed_at?: string;
  duration_hours: number;
}

interface ChildPenaltiesProps {
  penalties: Penalty[];
}

export function ChildPenalties({ penalties }: ChildPenaltiesProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const activePenalties = penalties.filter(penalty => penalty.is_active);
  const completedPenalties = penalties.filter(penalty => !penalty.is_active);

  const getRemainingTime = (createdAt: string, durationHours: number) => {
    const endTime = new Date(createdAt);
    endTime.setHours(endTime.getHours() + durationHours);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Terminé';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
      className="lg:col-span-2"
    >
      <Card className="p-6 h-full border-0 shadow-2xl bg-gradient-to-br from-red-50 to-orange-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Mes Pénalités</h3>
          <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-gray-800">
              {activePenalties.length} active{activePenalties.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50'
            }`}
          >
            <Clock className="h-4 w-4" />
            Actives
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Historique
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 'active' ? (
            activePenalties.length > 0 ? (
              activePenalties.map((penalty) => (
                <motion.div
                  key={penalty.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-white rounded-xl p-4 shadow-md border border-red-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">{penalty.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{penalty.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span>-{penalty.points_deduction} points</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{getRemainingTime(penalty.created_at, penalty.duration_hours)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-gray-500">Aucune pénalité active</p>
              </motion.div>
            )
          ) : (
            completedPenalties.length > 0 ? (
              completedPenalties.map((penalty) => (
                <motion.div
                  key={penalty.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-white/50 rounded-xl p-4 shadow-md border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">{penalty.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{penalty.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span>-{penalty.points_deduction} points</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Terminé le {new Date(penalty.completed_at!).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-gray-500">Aucune pénalité terminée</p>
              </motion.div>
            )
          )}
        </div>
      </Card>
    </motion.div>
  );
} 