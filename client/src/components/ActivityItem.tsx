import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import type { Activity, Set as WorkoutSet } from '../types/workout';
import ParameterSetInput from './ParameterSetInput';

interface ActivityItemProps {
  activity: Activity;
  onUpdate: (updated: Activity) => void;
  onDelete: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onUpdate, onDelete }) => {
  const [isAddingSet, setIsAddingSet] = useState(activity.sets.length === 0);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);

  /* Add a new set/parameter to this activity */
  const handleAddSet = (newSet: WorkoutSet) => {
    onUpdate({
      ...activity,
      sets: [...activity.sets, newSet],
    });
    setIsAddingSet(false);
  };

  /* Update an existing set */
  const handleUpdateSet = (setIndex: number, updated: WorkoutSet) => {
    const newSets = [...activity.sets];
    newSets[setIndex] = updated;
    onUpdate({ ...activity, sets: newSets });
    // close edit mode for that set
    setEditingSetIndex(null);
  };

  /* Delete a set */
  const handleDeleteSet = (setIndex: number) => {
    onUpdate({
      ...activity,
      sets: activity.sets.filter((_, i) => i !== setIndex),
    });
  };

  /* Toggle set status through completed → incomplete → partial → none */
  const handleToggleStatus = () => {
    const statusCycle: WorkoutSet['status'][] = ['none', 'completed', 'partial', 'incomplete'];
    const currentIndex = statusCycle.indexOf(activity.sets[0]?.status || 'none');
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    onUpdate({
      ...activity,
      sets: activity.sets.map((s) => ({ ...s, status: nextStatus })),
    });
  };

  const getStatusIcon = () => {
    const status = activity.sets[0]?.status || 'none';
    switch (status) {
      case 'completed':
        return <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />;
      case 'partial':
        return <WarningIcon sx={{ fontSize: 20, color: 'warning.main' }} />;
      case 'incomplete':
        return <CloseIcon sx={{ fontSize: 20, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.5,
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Activity Name */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activity.name}
          </Typography>

          {/* Display Sets */}
          {activity.sets.map((set, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
                flexWrap: 'wrap',
              }}
            >
              {editingSetIndex === index ? (
                <Box sx={{ width: '100%' }}>
                  <ParameterSetInput
                    initialSet={set}
                    onSave={(updated) => handleUpdateSet(index, updated)}
                    onCancel={() => setEditingSetIndex(null)}
                  />
                </Box>
              ) : (
                <>
                  <Chip
                    label={set.parameter}
                    size="small"
                    sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}
                  />
                  <Typography variant="body2">
                    {set.value} {set.unit}
                  </Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => setEditingSetIndex(index)}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSet(index)}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>
          ))}

          {/* Add Set Form */}
          {isAddingSet && (
            <Box sx={{ mt: 1 }}>
              <ParameterSetInput
                onSave={handleAddSet}
                onCancel={() => setIsAddingSet(false)}
              />
            </Box>
          )}

          {/* Add More Parameters Button */}
          {!isAddingSet && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                cursor: 'pointer',
                textDecoration: 'underline',
                '&:hover': { color: '#b473ff' },
              }}
              onClick={() => setIsAddingSet(true)}
            >
              Add more specifics...
            </Typography>
          )}
        </Box>

        {/* Action Icons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
          <IconButton size="small" onClick={handleToggleStatus}>
            {getStatusIcon() || <CheckIcon sx={{ fontSize: 20, color: 'action.disabled' }} />}
          </IconButton>
          <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ActivityItem;
