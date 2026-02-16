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
    const { day, title, activities, isSpecial } = req.body;
    const userId = req.user?.userId;

    // Enforce 7 daily-menu limit (special menus are unlimited)
    // Also treat records with day === "Special" as special to cover legacy data
    if (!isSpecial) {
      const dailyCount = await Workout.countDocuments({
        userId,
        isSpecial: { $ne: true },
        day: { $ne: "Special" },
      });
      if (dailyCount >= 7) {
        return res.status(400).json({
          message: "You can only create up to 7 daily menus (Monday–Sunday). Use a Special Menu instead.",
        });
      }
    }

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
      isSpecial: !!isSpecial,
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
    const { day, title, activities, lastCompletedDate, isSpecial } = req.body;
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
      { day, title, activities: cleanedActivities, lastCompletedDate, isSpecial },
      { new: true },
    );

    if (!workout) {
      return res
        .status(404)
        .json({ message: "Workout not found or unauthorized" });
    }

    // Only log activity data for non-special (daily) menus
    // Treat day === "Special" as special to ensure consistent behavior for all users
    const isSpecialMenu = !!workout.isSpecial || workout.day === "Special";
    if (userId && lastCompletedDate && !isSpecialMenu) {
      const todayStr = new Date().toDateString();
      const completedStr = new Date(lastCompletedDate).toDateString();
      if (todayStr === completedStr) {
        // Skip logging if the menu's weekday hasn't arrived yet this week
        const dayMap: Record<string, number> = {
          Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
          Friday: 5, Saturday: 6, Sunday: 0,
        };
        const menuJsDay = dayMap[workout.day];
        const todayJsDay = new Date().getDay();
        const menuIdx = menuJsDay !== undefined ? (menuJsDay + 6) % 7 : -1;
        const todayIdx = (todayJsDay + 6) % 7;
        const isFutureDay = menuIdx > todayIdx;

        if (!isFutureDay) {
          // Record against the actual completion date (even if the menu is for a different weekday)
          const recordDate = new Date();
          recordDate.setHours(0, 0, 0, 0);

        try {
          const logsToInsert: any[] = [];

          if (workout.activities && workout.activities.length > 0) {
            workout.activities.forEach((activity) => {
              activity.sets.forEach((set) => {
                if (
                  set.value > 0 &&
                  (set.status === "completed" || set.status === "partial")
                ) {
                  logsToInsert.push({
                    userId,
                    date: recordDate,
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

        await updateStreak(userId, recordDate);
        await storeDailyCompletion(userId, recordDate);
        }
      }
    }

    res.json(workout);
  } catch (error: any) {
    console.error("✗ Error updating workout:", error.message);
    res.status(500).json({ message: "Error updating workout" });
  }
};

// Update user's daily streak based on the actual recording date
const updateStreak = async (userId: string, recordDate: Date) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const todayDateOnly = new Date(
      recordDate.getFullYear(),
      recordDate.getMonth(),
      recordDate.getDate(),
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
        // (But still record the date in streakDates for the 20-day grid)
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

/** Aggregate completion % across all daily menus completed on the recording date. */
const storeDailyCompletion = async (userId: string, recordDate: Date) => {
  try {
    const dateKey = recordDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const recordDateStr = recordDate.toDateString();

    // Gather all daily (non-special) menus completed on this date
    // Exclude records marked as special or with day === "Special" to cover legacy data
    const allDaily = await Workout.find({
      userId,
      isSpecial: { $ne: true },
      day: { $ne: "Special" },
    });
    const completedToday = allDaily.filter((w) => {
      if (!w.lastCompletedDate) return false;
      return new Date(w.lastCompletedDate).toDateString() === recordDateStr;
    });

    // Average completion across all menus recorded today
    const menuScores = completedToday.map((w) => {
      const actScores = w.activities.map((act) => {
        if (!act.sets.length) return 0;
        const sum = act.sets.reduce(
          (acc, s) => acc + (s.status === "completed" ? 100 : s.status === "partial" ? 50 : 0),
          0,
        );
        return sum / act.sets.length;
      });
      return actScores.length
        ? actScores.reduce((a, b) => a + b, 0) / actScores.length
        : 0;
    });

    const avgPct = menuScores.length
      ? Math.round(menuScores.reduce((a, b) => a + b, 0) / menuScores.length)
      : 0;

    await User.findByIdAndUpdate(userId, {
      $set: { [`dailyCompletions.${dateKey}`]: avgPct },
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
