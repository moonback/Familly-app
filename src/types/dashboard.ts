export interface Child {
  id: string;
  name: string;
  age: number;
  points: number;
  avatar_url: string;
  custom_color: string;
  user_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  label: string;
  points_reward: number;
  is_daily: boolean;
  age_min: number;
  age_max: number;
  category: 'quotidien' | 'scolaire' | 'maison' | 'personnel';
}

export interface ChildTask {
  id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string;
  task: Task;
}

export interface Reward {
  id: string;
  label: string;
  cost: number;
}

export interface Riddle {
  id: string;
  question: string;
  answer: string;
  points: number;
  is_solved: boolean;
}

export interface ChildRewardClaimed {
  id: string;
  child_id: string;
  reward_id: string;
  claimed_at: string;
  reward: Reward;
}

export interface PenaltyHistory {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  child_id: string;
  points: number;
  reason: string;
  created_at: string;
  reward?: Reward;
  task?: Task;
} 