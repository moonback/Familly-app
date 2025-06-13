import { User } from '@supabase/supabase-js';

export interface Child {
  id: string;
  user_id: string;
  name: string;
  age?: number;
  avatar_url?: string;
  custom_color?: string;
  points: number;
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  label: string;
  points_reward: number;
  is_daily: boolean;
  age_min: number;
  age_max: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
  created_at: string;
  updated_at?: string;
}

export interface Rule {
  id: string;
  user_id: string;
  label: string;
  points_penalty: number;
  created_at: string;
  updated_at?: string;
}

export interface Reward {
  id: string;
  user_id: string;
  label: string;
  cost: number;
  created_at: string;
  updated_at?: string;
}

export interface Riddle {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  points: number;
  created_at: string;
}

export interface ShopItem {
  id: string;
  user_id: string;
  name: string;
  price: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  child_id: string;
  item_id: string;
  purchased_at: string;
}

export interface ChildTask {
  id: string;
  child_id: string;
  task_id: string;
  is_completed: boolean;
  completed_at?: string;
  due_date: string;
  created_at: string;
}

export interface ChildRuleViolation {
  id: string;
  child_id: string;
  rule_id: string;
  violated_at: string;
  created_at: string;
}

export interface ChildRewardClaimed {
  id: string;
  child_id: string;
  reward_id: string;
  claimed_at: string;
  created_at: string;
}

export interface DailyRiddle {
  id: string;
  child_id: string;
  riddle_id: string;
  date: string;
  is_solved: boolean;
  created_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  child_id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

// Types pour les statistiques du dashboard parent
export interface DashboardStats {
  activeChildren: number;
  completedTasks: number;
  availableRewards: number;
  totalPoints: number;
  averageCompletion: number;
  isLoading: boolean;
  history: HistoryData[];
  childrenStats: ChildStats[];
  recentActivities: Activity[];
}

export interface HistoryData {
  date: string;
  tasks: number;
  rewards: number;
  points: number;
}

export interface ChildStats {
  id: string;
  name: string;
  points: number;
  completedTasks: number;
  pendingTasks: number;
  avatar_url: string;
  streak: number;
  lastActivity: string;
}

export interface Activity {
  type: 'task' | 'reward' | 'points';
  childName: string;
  description: string;
  timestamp: string;
  points?: number;
}

// Types pour les formulaires
export interface ChildFormData {
  name: string;
  age: string;
  avatar_url: string;
  custom_color: string;
}

export interface TaskFormData {
  label: string;
  points_reward: string;
  is_daily: boolean;
  age_min: string;
  age_max: string;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
}

export interface RuleFormData {
  label: string;
  points_penalty: string;
}

export interface RewardFormData {
  label: string;
  cost: string;
}

export interface RiddleFormData {
  question: string;
  answer: string;
  points: number;
}

// Types pour les erreurs
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Types pour les préférences utilisateur
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  notifications: boolean;
  emailNotifications: boolean;
}