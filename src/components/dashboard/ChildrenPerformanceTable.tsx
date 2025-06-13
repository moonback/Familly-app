import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Flame } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChildStats {
  id: string;
  name: string;
  points: number;
  completedTasks: number;
  pendingTasks: number;
  avatar_url: string;
  streak: number;
  lastActivity: string;
}

type Period = 'day' | 'week' | 'month';

interface ChildrenPerformanceTableProps {
  childrenStats: ChildStats[];
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export const ChildrenPerformanceTable = ({
  childrenStats,
  period,
  onPeriodChange
}: ChildrenPerformanceTableProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:20px_20px]" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <CardTitle className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-300 drop-shadow-lg" />
                Tableau de Performance
              </CardTitle>
              <p className="text-indigo-100/90 font-medium">Suivi détaillé des progrès de chaque enfant</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-[180px] bg-white/20 border-0 text-white backdrop-blur-sm">
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
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Enfant</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Points</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Streak 🔥</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Complétées</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">En attente</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Dernière activité</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700">Progression</th>
                </tr>
              </thead>
              <tbody>
                {childrenStats.map((child, index) => (
                  <motion.tr 
                    key={child.id} 
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="relative"
                        >
                          <Avatar className="h-10 w-10 ring-2 ring-blue-200 shadow-lg">
                            <AvatarImage src={child.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold">
                              {child.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                        </motion.div>
                        <div>
                          <span className="font-semibold text-gray-800">{child.name}</span>
                          <div className="flex items-center gap-1 mt-1">
                            <Heart className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-gray-500 font-medium">Membre</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {child.points}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-600">{child.streak}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-medium text-green-600">{child.completedTasks}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-medium text-gray-600">{child.pendingTasks}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-gray-500 font-medium">
                        {child.lastActivity ? format(new Date(child.lastActivity), 'dd MMM', { locale: fr }) : 'Jamais'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden">
                        <motion.div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(child.completedTasks / (child.completedTasks + child.pendingTasks)) * 100}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 