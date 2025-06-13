import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, Gift, Zap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Activity {
  type: 'task' | 'reward' | 'points';
  childName: string;
  description: string;
  timestamp: string;
  points?: number;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white/70 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-500 to-green-600 text-white p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-7 w-7" />
            <div>
              <CardTitle className="text-2xl font-bold">Activités Récentes</CardTitle>
              <p className="text-teal-100 text-sm">Ce qui s'est passé dernièrement dans la famille</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {activities.length > 0 ? (
            <ul className="space-y-4">
              {activities.map((activity, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm"
                >
                  <div className={`p-2 rounded-full ${
                    activity.type === 'task' ? 'bg-emerald-100 text-emerald-600' : 
                    activity.type === 'reward' ? 'bg-purple-100 text-purple-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'task' && <CheckCircle className="h-5 w-5" />}
                    {activity.type === 'reward' && <Gift className="h-5 w-5" />}
                    {activity.type === 'points' && <Zap className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.childName} - {activity.description}</p>
                    {activity.points && (
                      <p className="text-sm text-gray-600">({activity.points > 0 ? '+' : ''}{activity.points} pts)</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(activity.timestamp), 'dd MMM HH:mm', { locale: fr })}
                  </span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">Aucune activité récente.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}; 