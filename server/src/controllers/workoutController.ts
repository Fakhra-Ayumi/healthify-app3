import { Response } from 'express';
import { Workout } from '../models/Workout';
import { User } from '../models/User';
import { evaluateBadges } from '../services/badgeEvaluator';
import { AuthRequest } from '../middleware/auth';

// Helper for day index
const getDayIndex = (day: string) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.indexOf(day);
};

export const getWorkouts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    console.log('📥 GET Workouts for User ID:', userId);
    const workouts = await Workout.find({ userId });
    
    // --- Auto Reset Logic (6-hour rule) ---
    const now = new Date();
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    let hasUpdates = false;

    for (const workout of workouts) {
      let needsReset = false;

      // Check if lastCompletedDate exists and was more than 6 hours ago
      if (workout.lastCompletedDate) {
        const lastCompleted = new Date(workout.lastCompletedDate);
        const timeDiff = now.getTime() - lastCompleted.getTime();
        
        if (timeDiff >= SIX_HOURS_MS) {
          needsReset = true;
          console.log(`Workout "${workout.title}" completed >6h ago. Resetting.`);
        }
      }

      if (needsReset) {
        let modified = false;
        
        // Reset statuses
        workout.activities.forEach(activity => {
          activity.sets.forEach(set => {
             // Reset completion status
             if (set.status !== 'incomplete') {
               set.status = 'incomplete'; 
               modified = true;
             }
             
             // Apply pending suggestion (if any) upon reset
             if (set.nextSuggestedValue != null) {
               set.previousValue = set.value;
               set.value = set.nextSuggestedValue;
               set.suggestionApplied = true;
               set.nextSuggestedValue = null;
               modified = true;
             }
          });
        });

        // Always save if we flagged for reset (to clear lastCompletedDate)
        // even if no sets were modified (unlikely if completed, but safe)
        if (needsReset) {
           workout.lastCompletedDate = null; // Clear completion flag
           // Only update lastResetDate if we want to track it, otherwise optional
           workout.lastResetDate = now; 
           await workout.save();
           hasUpdates = true;
        }
      }
    }

    // Refresh if updates occurred to return clean state
    if (hasUpdates) {
       const refreshedWorkouts = await Workout.find({ userId });
       console.log(`   Found ${refreshedWorkouts.length} workouts (after reset)`);
       res.json(refreshedWorkouts);
    } else {
       console.log(`   Found ${workouts.length} workouts`);
       res.json(workouts);
    }

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
    // On CREATE, "done for today" isn't pressed, so no streak update is needed in that case
    res.status(201).json(savedWorkout);
  } catch (error: any) {
    console.error('✗ Error creating workout:', error.message);
    res.status(500).json({ message: 'Error creating workout' });
  }
};

export const updateWorkout = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { day, title, activities, lastCompletedDate } = req.body;
    const userId = req.user?.userId;
    console.log('✏️  UPDATE Workout', id, 'for User ID:', userId);
    
    // Clean activities: remove client-side 'id' field before saving in bulk
    // Preserve the `nextSuggestedValue`, `previousValue`, `suggestionApplied` structure
    const cleanedActivities = activities?.map((activity: any) => ({
      name: activity.name,
      sets: activity.sets?.map((s: any) => ({
        parameter: s.parameter,
        value: s.value,
        unit: s.unit,
        status: s.status,
        nextSuggestedValue: s.nextSuggestedValue,
        previousValue: s.previousValue,
        suggestionApplied: s.suggestionApplied
      })) || []
    })) || [];
    
    // Ensure the workout belongs to the user
    const workout = await Workout.findOneAndUpdate(
      { _id: id, userId },
      { day, title, activities: cleanedActivities, lastCompletedDate },
      { new: true }
    );

    if (!workout) {
      console.log('   ✗ Workout not found or unauthorized');
      return res.status(404).json({ message: 'Workout not found or unauthorized' });
    }

    console.log('   ✓ Workout updated');
    
    // Check if the user just completed it today
    if (userId && lastCompletedDate) {
        const todayStr = new Date().toDateString();
        const completedStr = new Date(lastCompletedDate).toDateString();
        if (todayStr === completedStr) {
           // Calls updateStreak only on "Done for Today"
           await updateStreak(userId);
        }
    }
    
    res.json(workout);
  } catch (error: any) {
    console.error('✗ Error updating workout:', error.message);
    res.status(500).json({ message: 'Error updating workout' });
  }
};

// Helper: Update user's daily streak based on last active date
const updateStreak = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (!user.lastActiveDate) {
      user.currentStreak = 1;
      user.lastActiveDate = todayDateOnly;
    } else {
      const last = new Date(user.lastActiveDate);
      const lastDateOnly = new Date(last.getFullYear(), last.getMonth(), last.getDate());

      const diffMs = todayDateOnly.getTime() - lastDateOnly.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already counted for today
      } else if (diffDays === 1) {
        user.currentStreak += 1;
        user.lastActiveDate = todayDateOnly;
      } else {
        // Missed days, reset streak
        user.currentStreak = 1;
        user.lastActiveDate = todayDateOnly;
      }
    }

    // Handle 20-day challenge completion
    if (user.currentStreak >= (user.streakGoal || 20)) {
      user.streakCompletions += 1;
      user.currentStreak = 0; 
      user.lastActiveDate = null;
    }

    await user.save();
    await evaluateBadges(userId);
  } catch (err) {
    console.error('✗ Error updating streak:', (err as any).message);
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
