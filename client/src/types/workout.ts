// Client-side types matching server Workout model
export type ParameterType = 
  | 'Weight' 
  | 'Time' 
  | 'Distance' 
  | 'Reps' 
  | 'Sets'
  | 'Rest'
  | 'Incline'
  | 'Speed'
  | 'Resistance'
  | 'Cadence'
  | 'Height';

export type SetStatus = 'completed' | 'incomplete' | 'partial' | 'none';

export interface Set {
  parameter: ParameterType;
  value: number;
  unit: string;
  status: SetStatus;
}

export interface Activity {
  id: string; // Client-side ID for React keys
  name: string;
  sets: Set[];
}

export interface Workout {
  _id?: string; // MongoDB ID when persisted
  userId?: string;
  day: string;
  title: string;
  activities: Activity[];
}
