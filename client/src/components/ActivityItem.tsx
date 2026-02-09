import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Chip, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
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

  /* Handle status change via dropdown */
  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value as WorkoutSet['status'];
    onUpdate({
      ...activity,
      sets: activity.sets.map((s) => ({ ...s, status: newStatus })),
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon sx={{ fontSize: 20, color: '#82d727' }} />;
      case 'partial':
        return <HourglassTopIcon sx={{ fontSize: 20, color: '#fea34e' }} />;
      case 'incomplete':
        return <CloseIcon sx={{ fontSize: 20, color: '#fe4e80' }} />;
      default:
        return <CheckIcon sx={{ fontSize: 20, color: 'action.disabled' }} />;
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
                '&:hover': { color: '#a34efe' },
              }}
              onClick={() => setIsAddingSet(true)}
            >
              Add more specifics...
            </Typography>
          )}
        </Box>

        {/* Action Icons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, ml: 2 }}>
          <Select
            value={activity.sets[0]?.status || 'none'}
            onChange={handleStatusChange}
            variant="standard"
            disableUnderline
            displayEmpty
            renderValue={(value) => getStatusIcon(value)}
            sx={{
              minWidth: 'auto',
              '& .MuiSelect-select': { p: 0.5, display: 'flex' },
            }}
          >
            <MenuItem value="none">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon sx={{ fontSize: 20, color: 'action.disabled' }} />
                <Typography variant="body2">Not Started</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="completed">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon sx={{ fontSize: 20, color: '#82d727' }} />
                <Typography variant="body2">Completed</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="partial">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HourglassTopIcon sx={{ fontSize: 20, color: '#fea34e' }} />
                <Typography variant="body2">Partial</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="incomplete">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloseIcon sx={{ fontSize: 20, color: '#fe4e80' }} />
                <Typography variant="body2">Incomplete</Typography>
              </Box>
            </MenuItem>
          </Select>
          <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ActivityItem;
