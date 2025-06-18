import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ListChecksIcon, 
  CheckCircleIcon, 
  FilterIcon, 
  StarIcon,
  ClockIcon,
  CalendarIcon,
  TrophyIcon
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface Task {
  id: string;
  label: string;
  points_reward: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
  difficulty?: 'facile' | 'moyen' | 'difficile';
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

type FilterType = 'all' | 'quotidien' | 'scolaire' | 'maison' | 'personnel';
type SortType = 'default' | 'points' | 'category' | 'completed';

export const TaskList = ({ childTasks, onTaskToggle, childColor }: TaskListProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('default');
  const [showCompleted, setShowCompleted] = useState(true);

  const totalTasks = childTasks.length;
  const completedTasks = childTasks.filter(t => t.is_completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculer la répartition par catégorie
  const categoryStats = useMemo(() => {
    const stats = {
      quotidien: { total: 0, completed: 0 },
      scolaire: { total: 0, completed: 0 },
      maison: { total: 0, completed: 0 },
      personnel: { total: 0, completed: 0 }
    };

    childTasks.forEach(task => {
      const category = task.task.category;
      if (stats[category]) {
        stats[category].total++;
        if (task.is_completed) {
          stats[category].completed++;
        }
      }
    });

    return stats;
  }, [childTasks]);

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

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'facile': return 'text-green-600 bg-green-100';
      case 'moyen': return 'text-yellow-600 bg-yellow-100';
      case 'difficile': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'facile': return '⭐';
      case 'moyen': return '⭐⭐';
      case 'difficile': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = childTasks;

    // Filtrer par catégorie
    if (activeFilter !== 'all') {
      filtered = filtered.filter(task => task.task.category === activeFilter);
    }

    // Filtrer les tâches complétées
    if (!showCompleted) {
      filtered = filtered.filter(task => !task.is_completed);
    }

    // Trier les tâches
    switch (sortBy) {
      case 'points':
        filtered = [...filtered].sort((a, b) => b.task.points_reward - a.task.points_reward);
        break;
      case 'category':
        filtered = [...filtered].sort((a, b) => a.task.category.localeCompare(b.task.category));
        break;
      case 'completed':
        filtered = [...filtered].sort((a, b) => Number(a.is_completed) - Number(b.is_completed));
        break;
      default:
        // Ordre par défaut : non complétées en premier, puis par catégorie
        filtered = [...filtered].sort((a, b) => {
          if (a.is_completed !== b.is_completed) {
            return Number(a.is_completed) - Number(b.is_completed);
          }
          return a.task.category.localeCompare(b.task.category);
        });
    }

    return filtered;
  }, [childTasks, activeFilter, sortBy, showCompleted]);

  const totalPoints = childTasks.reduce((sum, task) => sum + task.task.points_reward, 0);
  const earnedPoints = childTasks
    .filter(task => task.is_completed)
    .reduce((sum, task) => sum + task.task.points_reward, 0);

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
              Mes Missions ({totalTasks}/15)
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {earnedPoints}/{totalPoints} points
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base text-gray-600 font-medium">Progression</span>
                <Progress value={progressPercentage} className="w-32 h-3 bg-gray-200" />
                <span className="text-sm font-medium text-gray-700">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques par catégorie */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div
                key={category}
                className={`p-3 rounded-lg border-2 ${
                  activeFilter === category 
                    ? 'border-[color:var(--child-color)] bg-[color:var(--child-color)]/10' 
                    : 'border-gray-200 bg-white/50'
                }`}
                style={{ '--child-color': childColor } as React.CSSProperties}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <span className="text-xs font-medium text-gray-600 capitalize">
                    {category}
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {stats.completed}/{stats.total}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}
                    style={{ width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Filtres et options */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">Filtres:</span>
            </div>
            
            {(['all', 'quotidien', 'scolaire', 'maison', 'personnel'] as FilterType[]).map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={`text-xs ${
                  activeFilter === filter 
                    ? 'bg-[color:var(--child-color)] border-[color:var(--child-color)]' 
                    : 'hover:border-[color:var(--child-color)]'
                }`}
                style={{ '--child-color': childColor } as React.CSSProperties}
              >
                {filter === 'all' ? 'Toutes' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}

            <div className="flex items-center gap-2 ml-4">
              <Checkbox
                checked={showCompleted}
                onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                className="h-4 w-4"
              />
              <Label className="text-xs text-gray-600">Afficher les complétées</Label>
            </div>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="default">Ordre par défaut</option>
              <option value="points">Points</option>
              <option value="category">Catégorie</option>
              <option value="completed">Statut</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
          <AnimatePresence mode="wait">
            <div className="space-y-4">
              {filteredAndSortedTasks.map((childTask) => (
                <motion.div
                  key={childTask.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryIcon(childTask.task.category)}</span>
                      <Label className={`text-xl font-medium ${
                        childTask.is_completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {childTask.task.label}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge 
                        className={`px-3 py-1 text-xs font-medium bg-gradient-to-r ${getCategoryColor(childTask.task.category)} text-white`}
                      >
                        {childTask.task.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        <span className={`text-sm font-medium ${childTask.is_completed ? 'text-gray-500' : 'text-gray-600'}`}>
                          {childTask.task.points_reward} points
                        </span>
                      </div>
                      {childTask.task.difficulty && (
                        <Badge className={`px-2 py-1 text-xs ${getDifficultyColor(childTask.task.difficulty)}`}>
                          <span className="mr-1">{getDifficultyIcon(childTask.task.difficulty)}</span>
                          {childTask.task.difficulty}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(childTask.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
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

              {filteredAndSortedTasks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-xl text-gray-600">
                    {activeFilter === 'all' 
                      ? "Aucune mission pour aujourd'hui !" 
                      : `Aucune mission ${activeFilter} pour aujourd'hui !`
                    }
                  </p>
                  <p className="text-base text-gray-500 mt-2">
                    {activeFilter === 'all' 
                      ? "15 missions seront générées automatiquement chaque jour !" 
                      : "Change de filtre pour voir d'autres missions !"
                    }
                  </p>
                  {activeFilter !== 'all' && (
                    <Button
                      onClick={() => setActiveFilter('all')}
                      className="mt-4"
                      style={{ '--child-color': childColor } as React.CSSProperties}
                    >
                      Voir toutes les missions
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 