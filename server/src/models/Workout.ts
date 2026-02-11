import { Schema, model, Document, Types } from 'mongoose';

export interface IWorkout extends Document {
  userId: Types.ObjectId;
  day: string; 
  title: string;
  lastCompletedDate?: Date;
  lastResetDate?: Date;
  activities: {
    name: string;
    sets: {
      parameter: 'Weight' | 'Time' | 'Distance' | 'Reps' | 'Sets' | 'Rest' | 'Incline' | 'Speed' | 'Resistance' | 'Cadence' | 'Height';
      value: number;
      unit: string; 
      status: 'completed' | 'incomplete' | 'partial' | 'none';
      nextSuggestedValue?: number;
      previousValue?: number;
      suggestionApplied?: boolean;
    }[];
  }[];
}

const WorkoutSchema = new Schema<IWorkout>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true },
  title: { type: String, required: true },
  lastCompletedDate: { type: Date, default: null },
  lastResetDate: { type: Date, default: null },
  
  activities: [{
    name: { type: String, required: true },
    sets: [{
      parameter: { 
        type: String, 
        enum: ['Weight', 'Time', 'Distance', 'Reps', 'Sets', 'Rest', 'Incline', 'Speed', 'Resistance', 'Cadence', 'Height'],
        required: true 
      },
      value: { type: Number, required: true },
      unit: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['completed', 'incomplete', 'partial', 'none'], 
        default: 'none' 
      },
      nextSuggestedValue: { type: Number, default: null },
      previousValue: { type: Number, default: null },
      suggestionApplied: { type: Boolean, default: false }
    }]
  }]
}, { timestamps: true });

export const Workout = model<IWorkout>('Workout', WorkoutSchema);