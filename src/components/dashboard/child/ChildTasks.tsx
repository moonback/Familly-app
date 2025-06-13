import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'pending' | 'completed' | 'overdue';
  due_date: string;
  child_id: string;
  created_at: string;
}

interface ChildTasksProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
}

export function ChildTasks({ tasks, onTaskComplete }: ChildTasksProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'overdue':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-yellow-500/20 text-yellow-500';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
      className="lg:col-span-2"
    >
      <Card className="p-6 h-full border-0 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Mes Tâches</h3>
        
        <div className="space-y-4">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              className={`relative p-4 rounded-xl border ${
                selectedTask === task.id 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-200 bg-white'
              } shadow-md transition-all duration-300`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{task.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                      <span className="text-xs font-medium">
                        {task.status === 'completed' ? 'Terminé' : 
                         task.status === 'overdue' ? 'En retard' : 'En cours'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span className="font-medium">{task.points}</span>
                      <span>points</span>
                    </div>
                  </div>
                </div>

                {task.status === 'pending' && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => onTaskComplete(task.id)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    >
                      Terminer
                    </Button>
                  </motion.div>
                )}
              </div>

              {selectedTask === task.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <p className="text-sm text-gray-600">
                    Date limite : {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}

          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-gray-500">Aucune tâche pour le moment</p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
} 