import { useState } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Collapse } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { Workout, Activity } from '../types/workout';
import ActivityItem from './ActivityItem';

interface MenuCardProps {
  workout: Workout;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updated: Workout) => void;
  onDelete: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({
  workout,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(workout.title || '');
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  /* Update workout title */
  const handleTitleChange = () => {
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle) {
      // Revert to original title if empty
      setEditedTitle(workout.title || 'New Routine');
      setIsEditingTitle(false);
      return;
    }
    onUpdate({ ...workout, title: trimmedTitle });
    setIsEditingTitle(false);
  };

  /* Add a new activity to this workout */
  const handleAddActivity = (activity: Activity) => {
    onUpdate({
      ...workout,
      activities: [...workout.activities, activity],
    });
    setIsAddingActivity(false);
  };

  /* Update an existing activity */
  const handleUpdateActivity = (activityIndex: number, updated: Activity) => {
    const newActivities = [...workout.activities];
    newActivities[activityIndex] = updated;
    onUpdate({ ...workout, activities: newActivities });
  };

  /* Delete an activity */
  const handleDeleteActivity = (activityIndex: number) => {
    onUpdate({
      ...workout,
      activities: workout.activities.filter((_, i) => i !== activityIndex),
    });
  };

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'rgba(0,0,0,0.4)',
        bgcolor: '#e0c6fe',
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isExpanded ? 'action.hover' : 'transparent',
          cursor: 'pointer',
        }}
        onClick={onToggleExpand}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <IconButton size="small" sx={{ mr: 1, color: 'text.primary' }}>
            {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
          {isEditingTitle ? (
            <TextField
              size="small"
              value={editedTitle}
              placeholder="Menu title"
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleChange();
                if (e.key === 'Escape') {
                  setEditedTitle(workout.title);
                  setIsEditingTitle(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              sx={{ flex: 1 }}
            />
          ) : (
            <Typography
              variant="h5"
              sx={{ fontWeight: 'bold', fontSize: '1.4rem' }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
            >
              {workout.title || 'Menu title'}
            </Typography>
          )}
        </Box>
        {!isExpanded && workout.activities.length > 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
            {workout.activities.map((a) => a.name).join(', ')}
          </Typography>
        )}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Delete ${workout.title || 'this menu'}?`)) {
              onDelete();
            }
          }}
          sx={{ 
            color: 'action.active', 
            '&:hover': { color: '#e63939', bgcolor: 'rgba(239, 83, 80, 0.08)' } 
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Expanded Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          {/* Activity List */}
          {workout.activities.map((activity, actIndex) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onUpdate={(updated) => handleUpdateActivity(actIndex, updated)}
              onDelete={() => handleDeleteActivity(actIndex)}
            />
          ))}

          {/* Add Activity Button */}
          {!isAddingActivity ? (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mt: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => setIsAddingActivity(true)}
            >
              <Typography variant="body2" color="text.secondary">
                Add an Activity...
              </Typography>
              <AddIcon sx={{ color: '#a34efe', fontSize: 20 }} />
            </Paper>
          ) : (
            <ActivityForm
              onSave={handleAddActivity}
              onCancel={() => setIsAddingActivity(false)}
            />
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

/* Inline form to add a new activity */
interface ActivityFormProps {
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        id: `${Date.now()}`,
        name: name.trim(),
        sets: [],
      });
      setName('');
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        variant="filled"
        label="Activity Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
      />
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <IconButton
          size="small"
          onClick={handleSave}
          sx={{ bgcolor: '#a34efe', color: '#fff', '&:hover': { bgcolor: '#e0c6fe' } }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default MenuCard;