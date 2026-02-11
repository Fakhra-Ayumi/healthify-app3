import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
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
  commitmentStartDate: Date;
  commitmentEndDate: Date;
  currentStreak: number;
  streakGoal: number; 
  streakCompletions: number;
  lastActiveDate?: Date | null;
  profileImage?: string; // Base64 or URL
  badges: string[];
}

// Schema for MongoDB
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true},
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  purpose: { type: String, default: "" },
  
  threeMonthGoal: { type: String, default: "" },
  threeMonthGoalStatus: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  threeMonthGoalCompletions: { type: Number, default: 0 },
  
  weeklyGoal: { type: String, default: "" },
  weeklyGoalStatus: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  weeklyGoalCompletions: { type: Number, default: 0 },

  weeklyGoalLockIn: { type: Date, default: null },
  threeMonthGoalLockIn: { type: Date, default: null },
  weeklyGoalLockInCount: { type: Number, default: 0 },
  threeMonthGoalLockInCount: { type: Number, default: 0 },

  commitmentStartDate: { type: Date, default: Date.now },
  currentStreak: { type: Number, default: 0 },
  streakGoal: { type: Number, default: 20 },
  streakCompletions: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },
  profileImage: { type: String, default: "" },
  badges: [{ type: String }]
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);