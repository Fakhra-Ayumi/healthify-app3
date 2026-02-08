import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const AppShell = () => {
  return (
    <Box sx={{ minHeight: '100vh', pb: 9 }}>
      <Box sx={{ px: 2, pt: 2 }}>
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
};

export default AppShell;