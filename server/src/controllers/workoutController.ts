//Create, Read, Update, and Delete workouts in relation to uerId
import { Response } from 'express';
import { Workout } from '../models/Workout';
import { AuthRequest } from '../middleware/auth';

export const getWorkouts = async (req: AuthRequest, res: Response) => {
  try {
    const workouts = await Workout.find({ userId: req.user.userId });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workouts' });
  }
};

export const createWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { day, title, activities } = req.body;
    const newWorkout = new Workout({
      userId: req.user.userId,
      day,
      title,
      activities
    });
    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);
  } catch (error) {
    res.status(500).json({ message: 'Error creating workout' });
  }
};

export const updateWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { day, title, activities } = req.body;
    
    // Ensure the workout belongs to the user
    const workout = await Workout.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { day, title, activities },
      { new: true }
    );

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found or unauthorized' });
    }

    res.json(workout);
  } catch (error) {
    res.status(500).json({ message: 'Error updating workout' });
  }
};

export const deleteWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Ensure the workout belongs to the user
    const deleted = await Workout.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!deleted) {
      return res.status(404).json({ message: 'Workout not found or unauthorized' });
    }

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workout' });
  }
};
