import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ListChecksIcon } from 'lucide-react';
import { ChildTask } from '@/types';

interface TaskListProps {
  tasks: ChildTask[];
  progressPercentage: number;
  completedTasks: number;
  totalTasks: number;
  onToggle: (id: string, completed: boolean) => void;
}

export function TaskList({ tasks, progressPercentage, completedTasks, totalTasks, onToggle }: TaskListProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quotidien':
        return '🌅';
      case 'scolaire':
        return '📚';
      case 'maison':
        return '🏠';
      case 'personnel':
        return '🌟';
      default:
        return '✅';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quotidien':
        return 'from-blue-400 to-blue-600';
      case 'scolaire':
        return 'from-green-400 to-green-600';
      case 'maison':
        return 'from-orange-400 to-orange-600';
      case 'personnel':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, delay: 0.4 }}
      className="md:col-span-6 lg:col-span-6"
    >
      <Card className="shadow-2xl border-0 overflow-hidden h-full bg-white/90 backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-300">
        <div className="relative">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)]" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <ListChecksIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" />
                Mes Missions
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-base text-gray-600">Progression</span>
                <Progress value={progressPercentage} className="w-40 h-3" />
                <span className="text-sm font-medium text-gray-700">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {tasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 ${
                    task.is_completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-purple-200'
                  } transition-all duration-300`}
                >
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={() => onToggle(task.id, task.is_completed)}
                    className="h-7 w-7 border-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getCategoryIcon(task.task.category)}</span>
                      <Label className="text-xl font-medium">{task.task.label}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(task.task.category)} text-white`}>
                        {task.task.category}
                      </span>
                      <span className="text-base text-gray-500">{task.task.points_reward} points</span>
                    </div>
                  </div>
                  {task.is_completed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500">
                      <CheckCircleIcon className="h-7 w-7" />
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-xl text-gray-600">Aucune mission pour aujourd'hui !</p>
                  <p className="text-base text-gray-500 mt-2">Reviens demain pour de nouvelles aventures !</p>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}
