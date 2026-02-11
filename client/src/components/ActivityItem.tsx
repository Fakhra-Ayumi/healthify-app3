import { useState } from 'react';
import { Box, Paper, Typography, IconButton, Select, MenuItem, TextField, Tooltip } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { Activity, Set as WorkoutSet } from '../types/workout';
import ParameterSetInput from './ParameterSetInput';

interface ActivityItemProps {
  activity: Activity;
  onUpdate: (updated: Activity) => void;
  onDelete: () => void;
  readOnly?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onUpdate, onDelete, readOnly = false }) => {
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


  /* Update an existing set (including suggestion value change) */
  const handleUpdateSet = (setIndex: number, updated: WorkoutSet) => {
    const newSets = [...activity.sets];
    newSets[setIndex] = updated;
    onUpdate({ ...activity, sets: newSets });
    // close edit mode for that set
    setEditingSetIndex(null);
  };
  
  const handleSuggestionValueChange = (setIndex: number, valStr: string) => {
    const newSets = [...activity.sets];
    const val = parseFloat(valStr);
    if (val === 0) return;
    newSets[setIndex] = { 
       ...newSets[setIndex], 
       nextSuggestedValue: isNaN(val) ? null : val 
    };
    onUpdate({ ...activity, sets: newSets });
  };

  const handleAcceptSuggestion = (setIndex: number) => {
    const newSets = [...activity.sets];
    const s = newSets[setIndex];
    newSets[setIndex] = {
      ...s,
      suggestionApplied: false,
      previousValue: null
    };
    onUpdate({ ...activity, sets: newSets });
  };

  const handleRejectSuggestion = (setIndex: number) => {
    const newSets = [...activity.sets];
    const s = newSets[setIndex];
    if (s.previousValue !== null && s.previousValue !== undefined) {
      newSets[setIndex] = {
        ...s,
        value: s.previousValue,
        suggestionApplied: false,
        previousValue: null
      };
    } else {
       // just clear flags if no previous val
       newSets[setIndex] = {
        ...s,
        suggestionApplied: false
      };
    }
    onUpdate({ ...activity, sets: newSets });
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
        borderColor: 'rgba(0,0,0,0.4)',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Activity Name */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5, fontSize: '1.15rem' }}>
            {activity.name}
          </Typography>

          {/* Display sets in horizontal flexible row */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {activity.sets.map((set, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: set.suggestionApplied ? '#fff9c4' : 'action.hover', // Highlight if suggestion applied
                  border: set.suggestionApplied ? '1px solid #fbc02d' : 'none',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75,
                  maxWidth: '100%',
                  gap: 1,
                }}
              >
                {editingSetIndex === index ? (
                  <Box sx={{ width: '100%', minWidth: 200 }}>
                    <ParameterSetInput
                      initialSet={set}
                      onSave={(updated) => handleUpdateSet(index, updated)}
                      onCancel={() => setEditingSetIndex(null)}
                    />
                  </Box>
                ) : (
                  <>
                    <Typography 
                      variant="body1" 
                      sx={{ fontWeight: 'bold' }}
                    >
                      {set.parameter}:
                    </Typography>

                    <Typography variant="body1">
                       {set.value} {set.unit}
                    </Typography>
                    
                    {/* Show indicator if value changed via suggestion */}
                    {set.suggestionApplied && set.previousValue !== null && (
                       <Tooltip title={`Previous: ${set.previousValue}`}>
                          <ArrowForwardIcon color="primary" sx={{ fontSize: 16 }} />
                       </Tooltip>
                    )}

                    {/* Suggestion input (only if not readOnly and not suggestionApplied) */}
                    {!readOnly && !set.suggestionApplied && (
                       <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                          <Typography variant="caption" sx={{ mr: 0.5, color: 'text.secondary', display: {xs: 'none', sm: 'block'} }}>
                            Next:
                          </Typography>
                          <TextField 
                             variant="standard" 
                             type="number" 
                             placeholder="?"
                             value={set.nextSuggestedValue ?? ''}
                             onChange={(e) => handleSuggestionValueChange(index, e.target.value)}
                             sx={{ width: 40, '& input': { py: 0, fontSize: '0.85rem', textAlign: 'center' } }}
                          />
                       </Box>
                    )}

                    <Box sx={{ display: 'flex', ml: 1 }}>
                      {/* If suggestion applied, show Check/Cross logic instead of Edit/Delete */}
                      {set.suggestionApplied ? (
                        <>
                           <IconButton size="small" onClick={() => handleAcceptSuggestion(index)} sx={{ color: 'success.main'}}>
                              <CheckIcon sx={{ fontSize: 18 }} />
                           </IconButton>
                           <IconButton size="small" onClick={() => handleRejectSuggestion(index)} sx={{ color: 'error.main'}}>
                              <CloseIcon sx={{ fontSize: 18 }} />
                           </IconButton>
                        </>
                      ) : (
                         !readOnly && (
                           <>
                              <IconButton size="small" onClick={() => setEditingSetIndex(index)}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSet(index)}
                                sx={{ 
                                  color: 'action.active', 
                                  '&:hover': { color: '#ef5350', bgcolor: 'rgba(239, 83, 80, 0.08)' } 
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                           </>
                         )
                      )}
                    </Box>
                  </>
                )}
              </Box>
            ))}
          </Box>

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
          {!isAddingSet && !readOnly && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mt: 1,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '1rem',
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
            disabled={readOnly}
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
          {!readOnly && (
           <IconButton 
            size="small" 
            onClick={onDelete} 
            sx={{ 
              color: 'action.active', 
              '&:hover': { color: '#ef5350', bgcolor: 'rgba(239, 83, 80, 0.08)' } 
            }}
           >
            <DeleteIcon sx={{ fontSize: 20 }} />
           </IconButton>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ActivityItem;
