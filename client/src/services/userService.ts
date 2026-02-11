import axios from 'axios';

// Define the User interface matching the backend model
export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
}

export interface UserProfile {
  _id?: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  purpose: string;
  threeMonthGoal: string;
  threeMonthGoalStatus: 'not_started' | 'in_progress' | 'completed';
  threeMonthGoalCompletions: number;
  weeklyGoal: string;
  weeklyGoalStatus: 'not_started' | 'in_progress' | 'completed';
  weeklyGoalCompletions: number;
  weeklyGoalLockIn?: Date | null;
  threeMonthGoalLockIn?: Date | null;
  weeklyGoalLockInCount: number;
  threeMonthGoalLockInCount: number;
  commitmentStartDate?: string;
  currentStreak: number;
  streakGoal: number;
  streakCompletions: number;
  lastActiveDate?: string | null;
  profileImage?: string;
  badges: string[];
}

export const fetchBadges = async (): Promise<Badge[]> => {
  const response = await axios.get('http://localhost:8000/api/badges');
  return response.data;
};

const API_URL = 'http://localhost:8000/api/auth/profile';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await axios.put(API_URL, updates, getAuthHeader());
  return response.data;
};
