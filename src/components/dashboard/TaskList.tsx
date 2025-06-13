import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ListChecksIcon, CheckCircleIcon } from 'lucide-react';

interface Task {
  id: string;
  label: string;
  points_reward: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
}

interface ChildTask {
  id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string;
  task: Task;
}

interface TaskListProps {
  childTasks: ChildTask[];
  onTaskToggle: (childTaskId: string, isCompleted: boolean) => void;
  childColor: string;
}

export const TaskList = ({ childTasks, onTaskToggle, childColor }: TaskListProps) => {
  const totalTasks = childTasks.length;
  const completedTasks = childTasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'quotidien': return '🌅';
      case 'scolaire': return '📚';
      case 'maison': return '🏠';
      case 'personnel': return '🌟';
      default: return '✅';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'quotidien': return 'from-blue-400 to-blue-600';
      case 'scolaire': return 'from-green-400 to-green-600';
      case 'maison': return 'from-orange-400 to-orange-600';
      case 'personnel': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
      className="lg:col-span-6"
    >
      <Card className="shadow-2xl border-0 overflow-hidden h-full bg-white/90 backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-300 group relative z-10">
        <div
          className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,var(--child-color)40,var(--child-color)20)] group-hover:opacity-30 transition-opacity duration-300"
          style={{ '--child-color': childColor } as React.CSSProperties}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTIwIDIwYzAgMTEuMDQ2LTguOTU0IDIwLTIwIDIwdjIwaDQwVjIwSDIweiIvPjwvZz48L3N2Zz4=')] opacity-10 group-hover:opacity-15 transition-opacity duration-300" />

        <CardHeader className="relative z-10 p-6 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <ListChecksIcon className="h-8 w-8 text-[color:var(--child-color)] drop-shadow-xl" style={{ '--child-color': childColor } as React.CSSProperties} />
              Mes Missions
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-base text-gray-600 font-medium">Progression</span>
              <Progress value={progressPercentage} className="w-40 h-3 bg-gray-200" />
              <span className="text-sm font-medium text-gray-700">
                {completedTasks}/{totalTasks}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-6">
          <div className="space-y-4">
            {childTasks.map((childTask) => (
              <motion.div
                key={childTask.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                onClick={() => onTaskToggle(childTask.id, childTask.is_completed)}
                className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer ${
                  childTask.is_completed 
                    ? 'bg-green-50 border-green-200 opacity-70' 
                    : 'bg-white border-gray-200 hover:border-[color:var(--child-color)]'
                } transition-all duration-300`}
                style={{ '--child-color': childColor } as React.CSSProperties}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={childTask.is_completed}
                    onCheckedChange={() => onTaskToggle(childTask.id, childTask.is_completed)}
                    className={`h-7 w-7 border-2 ${
                      childTask.is_completed ? 'border-green-500 text-green-500' : 'border-gray-300 text-gray-300'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getCategoryIcon(childTask.task.category)}</span>
                    <Label className={`text-xl font-medium ${
                      childTask.is_completed ? 'line-through text-gray-500' : 'text-gray-800'
                    }`}>
                      {childTask.task.label}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(childTask.task.category)} text-white`}
                    >
                      {childTask.task.category}
                    </span>
                    <span className={`text-base ${childTask.is_completed ? 'text-gray-500' : 'text-gray-600'}`}>
                      {childTask.task.points_reward} points
                    </span>
                  </div>
                </div>
                {childTask.is_completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="text-green-500"
                  >
                    <CheckCircleIcon className="h-7 w-7" />
                  </motion.div>
                )}
              </motion.div>
            ))}

            {childTasks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl text-gray-600">Aucune mission pour aujourd'hui !</p>
                <p className="text-base text-gray-500 mt-2">Reviens demain pour de nouvelles aventures !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 