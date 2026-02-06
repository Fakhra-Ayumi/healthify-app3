import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  purpose: string;
  threeMonthGoal: string;
  monthlyGoal: string;
  weeklyGoal: string;
  commitmentStartDate: Date;
  commitmentEndDate: Date;
  currentStreak: number;
  streakGoal: number; 
  badges: string[];
}

// Schema for MongoDB
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true},
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Goals and Memos from your sketches
  purpose: { type: String, default: "" },
  threeMonthGoal: { type: String, default: "" },
  monthlyGoal: { type: String, default: "" },
  weeklyGoal: { type: String, default: "" },

  commitmentStartDate: { type: Date, default: Date.now },
  currentStreak: { type: Number, default: 0 },
  streakGoal: { type: Number, default: 20 },
  badges: [{ type: String }]
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);