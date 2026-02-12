import { Response } from "express";
import { Workout } from "../models/Workout";
import { User } from "../models/User";
import { WorkoutLog } from "../models/WorkoutLog";
import { evaluateBadges } from "../services/badgeEvaluator";
import { AuthRequest } from "../middleware/auth";

export const getWorkouts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const workouts = await Workout.find({ userId });

    const now = new Date();
    let hasUpdates = false;

    for (const workout of workouts) {
      let needsReset = false;

      if (workout.lastCompletedDate) {
        const lastCompleted = new Date(workout.lastCompletedDate);
        const lastCompletedDay = new Date(
          lastCompleted.getFullYear(),
          lastCompleted.getMonth(),
          lastCompleted.getDate(),
        );
        const todayDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        if (todayDay.getTime() > lastCompletedDay.getTime()) {
          needsReset = true;
        }
      }

      if (needsReset) {
        workout.activities.forEach((activity) => {
          activity.sets.forEach((set) => {
            if (set.status !== "incomplete") {
              set.status = "incomplete";
            }

            if (set.nextSuggestedValue != null) {
              set.previousValue = set.value;
              set.value = set.nextSuggestedValue;
              set.suggestionApplied = true;
              set.nextSuggestedValue = null;
            }
          });
        });

        if (needsReset) {
          workout.lastCompletedDate = null;
          workout.lastResetDate = now;
          await workout.save();
          hasUpdates = true;
        }
      }
    }

    if (hasUpdates) {
      const refreshedWorkouts = await Workout.find({ userId });
      res.json(refreshedWorkouts);
    } else {
      res.json(workouts);
    }
  } catch (error: any) {
    console.error("✗ Error fetching workouts:", error.message);
    res.status(500).json({ message: "Error fetching workouts" });
  }
};

export const createWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { day, title, activities } = req.body;
    const userId = req.user?.userId;

    // Clean activities: remove client-side 'id' field before saving
    const cleanedActivities =
      activities?.map((activity: any) => ({
        name: activity.name,
        sets: activity.sets || [],
      })) || [];

    const newWorkout = new Workout({
      userId,
      day,
      title,
      activities: cleanedActivities,
    });
    const savedWorkout = await newWorkout.save();
    res.status(201).json(savedWorkout);
  } catch (error: any) {
    console.error("✗ Error creating workout:", error.message);
    res.status(500).json({ message: "Error creating workout" });
  }
};

export const updateWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { day, title, activities, lastCompletedDate } = req.body;
    const userId = req.user?.userId;

    // Clean activities: remove client-side 'id' field before saving in bulk
    const cleanedActivities =
      activities?.map((activity: any) => ({
        name: activity.name,
        sets:
          activity.sets?.map((s: any) => ({
            parameter: s.parameter,
            value: s.value,
            unit: s.unit,
            status: s.status,
            nextSuggestedValue: s.nextSuggestedValue,
            previousValue: s.previousValue,
            suggestionApplied: s.suggestionApplied,
          })) || [],
      })) || [];

    const workout = await Workout.findOneAndUpdate(
      { _id: id, userId },
      { day, title, activities: cleanedActivities, lastCompletedDate },
      { new: true },
    );

    if (!workout) {
      return res
        .status(404)
        .json({ message: "Workout not found or unauthorized" });
    }

    if (userId && lastCompletedDate) {
      const todayStr = new Date().toDateString();
      const completedStr = new Date(lastCompletedDate).toDateString();
      if (todayStr === completedStr) {
        try {
          const logsToInsert: any[] = [];
          const timestamp = new Date();

          if (workout.activities && workout.activities.length > 0) {
            workout.activities.forEach((activity) => {
              activity.sets.forEach((set) => {
                if (set.value > 0) {
                  logsToInsert.push({
                    userId,
                    date: timestamp,
                    workoutTitle: workout.title,
                    activityName: activity.name,
                    parameter: set.parameter,
                    value: set.value,
                    unit: set.unit,
                  });
                }
              });
            });
          }

          if (logsToInsert.length > 0) {
            await WorkoutLog.insertMany(logsToInsert);
          }
        } catch (logErr) {
          console.error("✗ Failed to save workout logs:", logErr);
        }

        await updateStreak(userId);
        await storeDailyCompletion(userId);
      }
    }

    res.json(workout);
  } catch (error: any) {
    console.error("✗ Error updating workout:", error.message);
    res.status(500).json({ message: "Error updating workout" });
  }
};

// Update user's daily streak based on last active date
const updateStreak = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    if (!user.lastActiveDate) {
      user.currentStreak = 1;
      user.lastActiveDate = todayDateOnly;
    } else {
      const last = new Date(user.lastActiveDate);
      const lastDateOnly = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate(),
      );

      const diffMs = todayDateOnly.getTime() - lastDateOnly.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already counted for today
      } else if (diffDays === 1) {
        user.currentStreak += 1;
        user.lastActiveDate = todayDateOnly;
      } else {
        // Missed days, reset current streak count for consecutive tracking
        // (But we still record the date in streakDates for the 20-day grid)
        user.currentStreak = 1;
        user.lastActiveDate = todayDateOnly;
      }
    }

    // Add today to streakDates if not present
    const dateExists = user.streakDates?.some(
      (d) => new Date(d).toDateString() === todayDateOnly.toDateString(),
    );
    if (!dateExists) {
      user.streakDates.push(todayDateOnly);
    }

    const startDate = new Date(user.commitmentStartDate);
    const startDayOnly = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
    );

    const msSinceStart = todayDateOnly.getTime() - startDayOnly.getTime();
    const daysSinceStart = Math.floor(msSinceStart / (1000 * 60 * 60 * 24)) + 1;

    if (daysSinceStart >= (user.streakGoal || 20)) {
      if (user.currentStreak >= (user.streakGoal || 20)) {
        user.streakCompletions += 1;
      }

      user.currentStreak = 0;
      user.streakDates = [];
      user.lastActiveDate = null;
      user.commitmentStartDate = new Date();
    }

    await user.save();
    await evaluateBadges(userId);
  } catch (err) {
    console.error("✗ Error updating streak:", (err as any).message);
  }
};

/** Compute and persist the day's average completion % from all completed workouts. */
const storeDailyCompletion = async (userId: string) => {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const completedToday = await Workout.find({
      userId,
      lastCompletedDate: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!completedToday.length) return;

    // Per activity: completed=100, partial=50, incomplete/none=0. Average sets → activity score.
    const activityScores: number[] = [];
    for (const w of completedToday) {
      for (const act of w.activities) {
        if (!act.sets.length) continue;
        const setScores = act.sets.map((s) =>
          s.status === "completed" ? 100 : s.status === "partial" ? 50 : 0,
        );
        activityScores.push(
          setScores.reduce((a, b) => a + b, 0) / setScores.length,
        );
      }
    }

    const dayPct = activityScores.length
      ? Math.round(
          activityScores.reduce((a, b) => a + b, 0) / activityScores.length,
        )
      : 0;

    const dateKey = startOfDay.toISOString().slice(0, 10); // "YYYY-MM-DD"
    await User.findByIdAndUpdate(userId, {
      $set: { [`dailyCompletions.${dateKey}`]: dayPct },
    });
  } catch (err) {
    console.error("✗ Error storing daily completion:", (err as any).message);
  }
};

export const deleteWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const deleted = await Workout.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Workout not found or unauthorized" });
    }

    res.json({ message: "Workout deleted successfully" });
  } catch (error: any) {
    console.error("✗ Error deleting workout:", error.message);
    res.status(500).json({ message: "Error deleting workout" });
  }
};
