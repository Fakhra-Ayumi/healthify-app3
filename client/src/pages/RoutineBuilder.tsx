import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { Workout } from '../types/workout';
import MenuCard from '../components/MenuCard';

const RoutineBuilder = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  /* Load workouts from localStorage on mount */
  useEffect(() => {
    const stored = localStorage.getItem('healthify-workouts');
    if (stored) {
      try {
        setWorkouts(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load workouts:', err);
      }
    }
  }, []);

  /* Save workouts to localStorage whenever they change */
  useEffect(() => {
    if (workouts.length > 0) {
      localStorage.setItem('healthify-workouts', JSON.stringify(workouts));
    }
  }, [workouts]);

  const handleAddMenu = () => {
    const newWorkout: Workout = {
      day: getDayName(workouts.length),
      title: '',
      activities: [],
    };
    const updated = [...workouts, newWorkout];
    setWorkouts(updated);
    setExpandedMenuId(`${workouts.length}`); // Auto-expand new menu
  };

  const handleUpdateWorkout = (index: number, updated: Workout) => {
    const newWorkouts = [...workouts];
    newWorkouts[index] = updated;
    setWorkouts(newWorkouts);
  };

  const handleDeleteWorkout = (index: number) => {
    setWorkouts(workouts.filter((_, i) => i !== index));
  };

  const getDayName = (index: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[index % 7];
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
          key={index}
          workout={workout}
          isExpanded={expandedMenuId === `${index}`}
          onToggleExpand={() => setExpandedMenuId(expandedMenuId === `${index}` ? null : `${index}`)}
          onUpdate={(updated) => handleUpdateWorkout(index, updated)}
          onDelete={() => handleDeleteWorkout(index)}
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