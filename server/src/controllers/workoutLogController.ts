import { Response } from "express";
import { WorkoutLog } from "../models/WorkoutLog";
import { AuthRequest } from "../middleware/auth";

export const getWorkoutHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const days = parseInt(req.query.days as string) || 14;

    // Normalize to full-day boundaries to avoid missing edge-of-day records
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logs = await WorkoutLog.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    res.json(logs);
  } catch (error: any) {
    console.error("Error fetching workout history:", error.message);
    res.status(500).json({ message: "Error fetching workout history" });
  }
};
