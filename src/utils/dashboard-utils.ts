import { Task } from '@/types/dashboard';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'quotidien': return '🌅';
    case 'scolaire': return '📚';
    case 'maison': return '🏠';
    case 'personnel': return '🌟';
    default: return '✅';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'quotidien': return 'from-blue-400 to-blue-600';
    case 'scolaire': return 'from-green-400 to-green-600';
    case 'maison': return 'from-orange-400 to-orange-600';
    case 'personnel': return 'from-purple-400 to-purple-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

export const calculateProgressPercentage = (totalTasks: number, completedTasks: number) => {
  return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
}; 