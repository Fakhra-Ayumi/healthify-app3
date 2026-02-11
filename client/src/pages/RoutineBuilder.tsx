import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { Workout } from '../types/workout';
import MenuCard from '../components/MenuCard';
import { fetchWorkouts, createWorkout, updateWorkoutService, deleteWorkoutService } from '../services/routineService';

const RoutineBuilder: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  /* Load workouts from server on mount */
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch (err) {
        console.error('Failed to load workouts:', err);
      }
    };
    loadWorkouts();
  }, []);

  const handleAddMenu = async () => {
    const newWorkout: Workout = {
      day: getDayName(workouts.length),
      title: 'Menu Title',
      activities: [],
    };

    // Optimistic update
    const timestamp = new Date().getTime();
    const tempId = `temp-${timestamp}`;
    const optimisticWorkout = { ...newWorkout, _id: tempId } as Workout;
    setWorkouts(prev => [...prev, optimisticWorkout]);
    setExpandedMenuId(tempId);

    try {
      const savedWorkout = await createWorkout(newWorkout);
      // Replace temp workout with real one
      setWorkouts(prev => prev.map(w => (w._id === tempId ? savedWorkout : w)));
      if (savedWorkout._id) setExpandedMenuId(savedWorkout._id);
    } catch (err) {
      console.error('Failed to add workout:', err);
      // Revert placeholder data
      setWorkouts(prev => prev.filter(w => w._id !== tempId));
      setExpandedMenuId(null);
    }
  };

  const handleUpdateWorkout = async (index: number, updated: Workout) => {
    // Update the placeholder data
    setWorkouts(prev => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });

    try {
      if (updated._id && !updated._id.startsWith('temp-')) {
        await updateWorkoutService(updated._id, updated);
      }
    } catch (err) {
      console.error('Failed to update workout:', err);
    }
  };

  const handleDeleteWorkout = async (index: number) => {
    const workoutToDelete = workouts[index];
    // Update the placeholder data
    setWorkouts(prev => prev.filter((_, i) => i !== index));

    try {
      if (workoutToDelete._id && !workoutToDelete._id.startsWith('temp-')) {
        await deleteWorkoutService(workoutToDelete._id);
      }
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  const getDayName = (index: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[index % 7];
  };

  const handleDoneForToday = (index: number) => {
    const workout = workouts[index];
    const updated = { ...workout, lastCompletedDate: new Date().toISOString() };
    handleUpdateWorkout(index, updated);
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center', color: '#000000' }}
      >
        Healthify Routine Builder
      </Typography>

      {/* Menu Cards */}
      {workouts.map((workout, index) => (
        <MenuCard
          key={workout._id || index}
          workout={workout}
          isExpanded={expandedMenuId === (workout._id || String(index))}
          onToggleExpand={() => {
            const id = workout._id || String(index);
            setExpandedMenuId(expandedMenuId === id ? null : id);
          }}
          onUpdate={(updated) => handleUpdateWorkout(index, updated)}
          onDelete={() => handleDeleteWorkout(index)}
          onDoneForToday={() => handleDoneForToday(index)}
        />
      ))}

      {/* Add Menu Button */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={handleAddMenu}
      >
        <Typography variant="body1" color="text.secondary">
          Add a Menu...
        </Typography>
        <AddIcon sx={{ color: '#a34efe' }} />
      </Paper>
    </Box>
  );
};

export default RoutineBuilder;