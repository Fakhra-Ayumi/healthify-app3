import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkout extends Document {
  userId: Types.ObjectId;
  day: string; 
  title: string;
  activities: {
    name: string;
    sets: {
      parameter: 'Weight' | 'Time' | 'Distance' | 'Reps'; //TODO add more
      value: number;
      unit: string; 
      status: 'completed' | 'incomplete' | 'partial' | 'none';
    }[];
  }[];
}

const WorkoutSchema = new Schema<IWorkout>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true },
  title: { type: String, required: true },
  
  activities: [{
    name: { type: String, required: true },
    sets: [{
      parameter: { 
        type: String, 
        enum: ['Weight', 'Time', 'Distance', 'Reps'], //TODO add more
        required: true 
      },
      value: { type: Number, required: true },
      unit: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['completed', 'incomplete', 'partial', 'none'], 
        default: 'none' 
      }
    }]
  }]
}, { timestamps: true });

export const Workout = model<IWorkout>('Workout', WorkoutSchema);