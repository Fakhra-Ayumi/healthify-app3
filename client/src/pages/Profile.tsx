import { Box, Typography } from '@mui/material';

const Profile = () => {
	return (
		<Box sx={{ p: 2 }}>
			<Typography variant="h5" sx={{ fontWeight: 'bold' }}>
				Profile
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
				Profile details will appear here.
			</Typography>
		</Box>
	);
};

export default Profile;
