import { Response } from 'express';
import { Workout } from '../models/Workout';
import { AuthRequest } from '../middleware/auth';

export const getWorkouts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log('📥 GET Workouts for User ID:', userId);
    const workouts = await Workout.find({ userId });
    console.log(`   Found ${workouts.length} workouts`);
    res.json(workouts);
  } catch (error: any) {
    console.error('✗ Error fetching workouts:', error.message);
    res.status(500).json({ message: 'Error fetching workouts' });
  }
};

export const createWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { day, title, activities } = req.body;
    const userId = req.user?.userId;
    console.log('📝 CREATE Workout for User ID:', userId);
    
    // Clean activities: remove client-side 'id' field before saving
    const cleanedActivities = activities?.map((activity: any) => ({
      name: activity.name,
      sets: activity.sets || []
    })) || [];
    
    const newWorkout = new Workout({
      userId,
      day,
      title,
      activities: cleanedActivities
    });
    const savedWorkout = await newWorkout.save();
    console.log('   ✓ Workout created:', savedWorkout._id);
    res.status(201).json(savedWorkout);
  } catch (error: any) {
    console.error('✗ Error creating workout:', error.message);
    res.status(500).json({ message: 'Error creating workout' });
  }
};

export const updateWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { day, title, activities } = req.body;
    const userId = req.user?.userId;
    console.log('✏️  UPDATE Workout', id, 'for User ID:', userId);
    
    // Clean activities: remove client-side 'id' field before saving
    const cleanedActivities = activities?.map((activity: any) => ({
      name: activity.name,
      sets: activity.sets || []
    })) || [];
    
    // Ensure the workout belongs to the user
    const workout = await Workout.findOneAndUpdate(
      { _id: id, userId },
      { day, title, activities: cleanedActivities },
      { new: true }
    );

    if (!workout) {
      console.log('   ✗ Workout not found or unauthorized');
      return res.status(404).json({ message: 'Workout not found or unauthorized' });
    }

    console.log('   ✓ Workout updated');
    res.json(workout);
  } catch (error: any) {
    console.error('✗ Error updating workout:', error.message);
    res.status(500).json({ message: 'Error updating workout' });
  }
};

export const deleteWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    console.log('🗑️  DELETE Workout', id, 'for User ID:', userId);
    
    // Ensure the workout belongs to the user
    const deleted = await Workout.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      console.log('   ✗ Workout not found or unauthorized');
      return res.status(404).json({ message: 'Workout not found or unauthorized' });
    }

    console.log('   ✓ Workout deleted');
    res.json({ message: 'Workout deleted successfully' });
  } catch (error: any) {
    console.error('✗ Error deleting workout:', error.message);
    res.status(500).json({ message: 'Error deleting workout' });
  }
};
