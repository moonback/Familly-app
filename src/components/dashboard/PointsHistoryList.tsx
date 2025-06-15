import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PointsHistory } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrophyIcon, GiftIcon, BrainIcon, AlertCircle } from 'lucide-react';

interface PointsHistoryListProps {
  pointsHistory: PointsHistory[];
  childColor: string;
}

export function PointsHistoryList({ pointsHistory, childColor }: PointsHistoryListProps) {
  const getIcon = (reason: string) => {
    if (reason.includes('Récompense')) return <GiftIcon className="w-5 h-5 text-purple-500" />;
    if (reason.includes('Tâche')) return <TrophyIcon className="w-5 h-5 text-green-500" />;
    if (reason.includes('Devinette')) return <BrainIcon className="w-5 h-5 text-blue-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-500" />;
  };

  const getProductName = (history: PointsHistory) => {
    if (history.reward) return history.reward.label;
    if (history.task) return history.task.label;
    return history.reason;
  };

  return (
    <Card className="bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <TrophyIcon className="w-6 h-6" />
          Historique des Points
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {pointsHistory.map((history) => (
              <div
                key={history.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/80 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {getIcon(history.reason)}
                  <div>
                    <p className="font-medium">{getProductName(history)}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(history.created_at), 'PPP', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className={`font-bold ${history.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {history.points > 0 ? '+' : ''}{history.points} points
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 