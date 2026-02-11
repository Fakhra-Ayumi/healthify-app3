import { Box, Typography } from '@mui/material';

const Milestones = () => {
  return (
    <Box sx={{ pb: 2, width: '100%', maxWidth: 'md', mx: 'auto' }}>
      <Typography variant="h6" sx={{ textAlign: 'center', color: 'grey', fontWeight: 'bold' }}>
        Healthify
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center', fontStyle: 'italic', color: '#000' }}>
        Milestones
      </Typography>
      {/* Milestones content goes here */}
    </Box>
  );
};

export default Milestones;
