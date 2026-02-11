import { Response } from 'express';
import { WorkoutLog } from '../models/WorkoutLog';
import { AuthRequest } from '../middleware/auth';

export const getWorkoutHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const days = parseInt(req.query.days as string) || 14;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const logs = await WorkoutLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    res.json(logs);
  } catch (error: any) {
    console.error('Error fetching workout history:', error.message);
    res.status(500).json({ message: 'Error fetching workout history' });
  }
};
