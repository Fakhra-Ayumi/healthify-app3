import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkoutLog extends Document {
  userId: Types.ObjectId;
  date: Date;
  workoutTitle: string;
  activityName: string;
  parameter: string;
  value: number;
  unit: string;
}

const WorkoutLogSchema = new Schema<IWorkoutLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  workoutTitle: { type: String, required: true },
  activityName: { type: String, required: true },
  parameter: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true }
}, { timestamps: true });

export const WorkoutLog = model<IWorkoutLog>('WorkoutLog', WorkoutLogSchema);
