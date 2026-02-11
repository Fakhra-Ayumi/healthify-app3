import { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Paper, Avatar, TextField, CircularProgress, Tooltip, Select, MenuItem, IconButton 
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { fetchUserProfile, updateUserProfile, fetchBadges, type UserProfile, type Badge } from '../services/userService';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);

  // Local state for inputs
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    purpose: '',
    threeMonthGoal: '',
    weeklyGoal: '',
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [userData, badgesData] = await Promise.all([
        fetchUserProfile(),
        fetchBadges()
      ]);
      setUser(userData);
      setAvailableBadges(badgesData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        purpose: userData.purpose || '',
        threeMonthGoal: userData.threeMonthGoal || '',
        weeklyGoal: userData.weeklyGoal || '',
      });
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = async (field: keyof typeof formData) => {
    if (!user) return;
    if (formData[field] !== user[field]) {
      try {
        const updated = await updateUserProfile({ [field]: formData[field] });
        setUser(updated);
      } catch (err) {
        console.error('Failed to update profile field', field, err);
      }
    }
  };

  const handleNameSave = async () => {
    if (formData.firstName.trim()) {
      handleBlur('firstName');
    } else {
      setFormData(prev => ({ ...prev, firstName: user?.firstName || '' }));
    }
    setIsEditingName(false);
  };

  const handleGoalStatusChange = async (
    field: 'weeklyGoalStatus' | 'threeMonthGoalStatus', 
    newStatus: string
  ) => {
    if (!user) return;
    try {
      const updated = await updateUserProfile({ [field]: newStatus });
      setUser(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size whether < 2MB for base64 storage
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const updated = await updateUserProfile({ profileImage: base64String });
        setUser(updated);
      } catch (err) {
        console.error('Failed to upload image', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const getBadgeIcon = (badge: Badge) => {
    // Determine color based on tier
    let color = '#1a237e'; // default blue-ish
    if (badge.tier === 'bronze') color = '#cd8532';
    if (badge.tier === 'silver') color = '#c0c0c0';
    if (badge.tier === 'gold') color = '#eed12b';

    const IconWrapper = ({ children }: { children: React.ReactNode }) => (
      <Box sx={{ color, fontSize: 40, display: 'flex' }}>
        {children}
      </Box>
    );

    switch (badge.icon) {
      case 'FitnessCenter': return <IconWrapper><FitnessCenterIcon fontSize="inherit" /></IconWrapper>;
      case 'DirectionsRun': return <IconWrapper><DirectionsRunIcon fontSize="inherit" /></IconWrapper>;
      case 'DirectionsBike': return <IconWrapper><DirectionsBikeIcon fontSize="inherit" /></IconWrapper>;
      case 'SelfImprovement': return <IconWrapper><SelfImprovementIcon fontSize="inherit" /></IconWrapper>;
      default: return <IconWrapper><EmojiEventsIcon fontSize="inherit" /></IconWrapper>;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#a34efe' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">Failed to load profile.</Typography>
      </Box>
    );
  }

  // --- Styles ---
  const darkInputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#000000',
      color: '#ffffff',
      borderRadius: 2,
      mt: 0,
      '& fieldset': { border: 'none' },
    },
    '& .MuiInputBase-input': {
      color: '#ffffff',
      p: 1,
      fontSize: '0.9rem',
    },
    '& .MuiInputBase-input::placeholder': {
      color: '#aaaaaa',
      opacity: 1,
    },
  };

  const labelSx = {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    mb: 0.5,
    display: 'block',
    color: '#000',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return '#ffffff';
      case 'in_progress':
        return '#fff9c4';
      case 'completed':
        return '#c8e6c9';
      default:
        return '#ffffff';
    }
  };

  return (
    <Box sx={{ pb: 4, width: '100%', maxWidth: 'md', mx: 'auto' }}>
      
      {/* Title */}
      <Typography 
        variant="h4" 
        align="center" 
          sx={{ 
          color: '#000', 
          fontWeight: 'bold', 
          fontFamily: 'inherit',
          mb: 2, 
          mt: 1 
        }}
      >
        {user?.firstName ? `${user.firstName}'s` : 'HELTHIFY'} Profile
      </Typography>

      {/* Main Card */}
      <Paper 
        elevation={3} 
        sx={{ 
          bgcolor: '#e0c6fe',
          borderRadius: 4,
          p: { xs: 2, md: 4 },
          mx: { xs: 2, md: 0 },
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Header: Avatar + Fields */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          {/* Avatar */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={user.profileImage}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#ffffff', 
                  color: '#000', 
                  border: '2px solid #000',
                  fontSize: '2rem'
                }}
              >
                {!user.profileImage && user.username.charAt(0).toUpperCase()}
              </Avatar>
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  bgcolor: '#a34efe',
                  color: '#fff',
                  p: 0.5,
                  '&:hover': { bgcolor: '#8e3edb' },
                  boxShadow: 2
                }}
                size="small"
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Box>
          </Box>

          {/* Name & Purpose */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box>
              {isEditingName ? (
                 <TextField
                 variant="outlined"
                 fullWidth
                 autoFocus
                 size="small"
                 value={formData.firstName}
                 onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                 onBlur={handleNameSave}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') handleNameSave();
                   if (e.key === 'Escape') {
                     setFormData(prev => ({ ...prev, firstName: user.firstName }));
                     setIsEditingName(false);
                   }
                 }}
                 sx={darkInputSx}
               />
              ) : (
                <Box 
                  onClick={() => setIsEditingName(true)}
                  sx={{ 
                    color: '#000', 
                    p: 0, 
                    borderRadius: 2,
                    cursor: 'text',
                    minHeight: '40px',
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    '&:hover': { opacity: 0.7 }
                  }}
                >
                  <Typography variant="h5" component="div">{formData.firstName || 'Click to set name'}</Typography>
                </Box>
              )}
            </Box>

            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              placeholder="Purpose of workout"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              onBlur={() => handleBlur('purpose')}
              sx={{ ...darkInputSx, mt: 0.5 }}
            />
          </Box>
        </Box>

        {/* 3. Badges System */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={labelSx}>Badges</Typography>
          <Box sx={{ display: 'flex', gap: 2, pb: 1, borderBottom: '2px solid #fff', minHeight: 50 }}>
            {/* Render badges the user HAS */}
            {user.badges.map((badgeName, idx) => {
              const badgeDef = availableBadges.find(b => b.name === badgeName);
              if (!badgeDef) return null;
              return (
                <Tooltip key={idx} title={badgeDef.description || badgeName}>
                  <Box>
                     {getBadgeIcon(badgeDef)}
                  </Box>
                </Tooltip>
              )
            })}
            
            {user.badges.length === 0 && (
              <Typography variant="body2" color="rgba(0,0,0,0.5)" sx={{ fontStyle: 'italic', alignSelf: 'center' }}>
                No badges yet. Keep training to earn them!
              </Typography>
            )}
          </Box>
        </Box>

        {/* Goals Section - Weekly first, then 3-month */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ ...labelSx, mb: 0 }}>Weekly Goal</Typography>
            <Select
              size="small"
              value={['not_started', 'in_progress', 'completed'].includes(user.weeklyGoalStatus) ? user.weeklyGoalStatus : 'not_started'}
              onChange={(e) => handleGoalStatusChange('weeklyGoalStatus', e.target.value)}
              sx={{ bgcolor: getStatusColor(user.weeklyGoalStatus || 'not_started'), height: 32, fontSize: '0.875rem' }}
            >
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </Box>
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              placeholder="Enter description..."
              value={formData.weeklyGoal}
              onChange={(e) => setFormData({ ...formData, weeklyGoal: e.target.value })}
              onBlur={() => handleBlur('weeklyGoal')}
              sx={{ ...darkInputSx, mt: 0.5 }}
            />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ ...labelSx, mb: 0 }}>3-months Goal</Typography>
            <Select
              size="small"
              value={['not_started', 'in_progress', 'completed'].includes(user.threeMonthGoalStatus) ? user.threeMonthGoalStatus : 'not_started'}
              onChange={(e) => handleGoalStatusChange('threeMonthGoalStatus', e.target.value)}
              sx={{ bgcolor: getStatusColor(user.threeMonthGoalStatus || 'not_started'), height: 32, fontSize: '0.875rem' }}
            >
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </Box>
            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              placeholder="Enter description..."
              value={formData.threeMonthGoal}
              onChange={(e) => setFormData({ ...formData, threeMonthGoal: e.target.value })}
              onBlur={() => handleBlur('threeMonthGoal')}
              sx={{ ...darkInputSx, mt: 0.5 }}
            />
        </Box>

        {/* 4. Commitment Challenge Auto-Sync (Render user.currentStreak) */}
        <Box>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={labelSx}>20 days Commitment Challenge</Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(32px, 1fr))', // Responsive grid
              gap: 1.5,
              mt: 1,
              width: '100%'
            }}
          >
            {Array.from({ length: 20 }).map((_, index) => {
              const isFilled = index < (user.currentStreak || 0);
              return (
                <Box
                  key={index}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: isFilled ? '#a34efe' : 'transparent',
                    border: '3px solid',
                    borderColor: '#a34efe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isFilled ? 'inset 0 0 0 2px #e0c6fe' : 'none',
                  }}
                />
              );
            })}
          </Box>
        </Box>

      </Paper>
    </Box>
  );
};

export default Profile;
