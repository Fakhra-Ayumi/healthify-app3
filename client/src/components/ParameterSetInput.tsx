import { useState, useEffect } from 'react';
import { Box, TextField, Select, MenuItem, IconButton, FormControl, InputLabel } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { Set as WorkoutSet, ParameterType } from '../types/workout';

interface ParameterSetInputProps {
  onSave: (set: WorkoutSet) => void;
  onCancel: () => void;
  initialSet?: WorkoutSet;
}

const ParameterSetInput: React.FC<ParameterSetInputProps> = ({
  onSave,
  onCancel,
  initialSet,
}) => {
  const [parameter, setParameter] = useState<ParameterType>(initialSet?.parameter || 'Time');
  const [value, setValue] = useState<string>(initialSet?.value.toString() || '');
  const [unit, setUnit] = useState<string>(initialSet?.unit || '');

  /* Parameter-to-unit mapping */
  const getUnitsForParameter = (param: ParameterType): string[] => {
    switch (param) {
      case 'Time':
        return ['s', 'min', 'h'];
      case 'Distance':
        return ['m', 'km', 'mi'];
      case 'Weight':
        return ['kg', 'lb', 'g'];
      case 'Reps':
        return ['times'];
      case 'Sets':
        return ['times'];
      case 'Rest':
        return ['min', 's'];
      case 'Incline':
        return ['%'];
      case 'Speed':
        return ['km/h', 'mph'];
      case 'Resistance':
        return ['Level'];
      case 'Cadence':
        return ['rpm', 'spm'];
      case 'Height':
        return ['cm', 'in'];
      default:
        return [''];
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (parameter && !isNaN(numValue) && unit) {
      onSave({
        parameter,
        value: numValue,
        unit,
        status: 'none',
      });
    }
  };

  const handleParameterChange = (newParam: ParameterType) => {
    setParameter(newParam);
    const units = getUnitsForParameter(newParam);
    setUnit(units[0] || '');
  };

  useEffect(() => {
    if (!unit && parameter) {
      const units = getUnitsForParameter(parameter);
      setUnit(units[0] || '');
    }
  }, [parameter, unit]);

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Parameter Dropdown */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Parameter</InputLabel>
        <Select
          value={parameter}
          label="Parameter"
          onChange={(e) => handleParameterChange(e.target.value as ParameterType)}
        >
          <MenuItem value="Time">Time</MenuItem>
          <MenuItem value="Distance">Distance</MenuItem>
          <MenuItem value="Weight">Weight</MenuItem>
          <MenuItem value="Reps">Reps</MenuItem>
          <MenuItem value="Sets">Sets</MenuItem>
          <MenuItem value="Rest">Rest</MenuItem>
          <MenuItem value="Incline">Incline</MenuItem>
          <MenuItem value="Speed">Speed</MenuItem>
          <MenuItem value="Resistance">Resistance</MenuItem>
          <MenuItem value="Cadence">Cadence</MenuItem>
          <MenuItem value="Height">Height</MenuItem>
        </Select>
      </FormControl>

      {/* Value Input */}
      <TextField
        size="small"
        type="number"
        label="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        sx={{ width: 100 }}
      />

      {/* Unit Dropdown */}
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <InputLabel>Unit</InputLabel>
        <Select value={unit} label="Unit" onChange={(e) => setUnit(e.target.value)}>
          {getUnitsForParameter(parameter).map((u) => (
            <MenuItem key={u} value={u}>
              {u}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Action Buttons */}
      <IconButton
        size="small"
        onClick={handleSave}
        sx={{ bgcolor: 'success.light', color: '#fff', '&:hover': { bgcolor: 'success.main' } }}
      >
        <CheckIcon sx={{ fontSize: 20 }} />
      </IconButton>
      <IconButton size="small" onClick={onCancel} sx={{ bgcolor: 'action.hover' }}>
        <CloseIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
};

export default ParameterSetInput;
