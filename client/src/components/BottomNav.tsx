import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (_event: React.SyntheticEvent, value: string) => {
    navigate(value);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1200,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
      }}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={handleChange}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            'color': '#000000',
            '&:focus': {
              outline: 'none',
            },
            '&.Mui-focusVisible': {
              outline: '2px solid #a34efe',
            }
          },
          '& .Mui-selected': {
            'color': '#a34efe',
          },
        }}
      >
        <BottomNavigationAction label="Milestones" value="/milestones" icon={<TimelineIcon />} />
        <BottomNavigationAction label="Routine" value="/" icon={<FitnessCenterIcon />} />
        <BottomNavigationAction label="Profile" value="/profile" icon={<AccountCircleIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;