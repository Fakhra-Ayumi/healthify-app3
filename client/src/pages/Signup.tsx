import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Link } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/auth/register', formData);
      localStorage.setItem('token', response.data.token);
      alert('Registration successful!');
      navigate('/app');
    } catch (err) {
      const message = axios.isAxiosError(err) 
        ? err.response?.data?.message 
        : err instanceof Error ? err.message : 'Registration failed';
      alert(message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" color="textPrimary" gutterBottom>Healthify</Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Record fast, exercise longer!
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="First Name" name="firstName" onChange={handleChange} variant="filled" />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Last Name" name="lastName" onChange={handleChange} variant="filled" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Username" name="username" onChange={handleChange} variant="filled" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Email" name="email" type="email" onChange={handleChange} variant="filled" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Confirm Email" name="confirmEmail" type="email" onChange={handleChange} variant="filled" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Password" name="password" type="password" onChange={handleChange} variant="filled" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" onChange={handleChange} variant="filled" />
            </Grid>
          </Grid>

          <Button 
            fullWidth 
            type="submit" 
            variant="contained" 
            sx={{ mt: 4, py: 1.5, borderRadius: 8, bgcolor: '#a34efe', fontWeight: 'bold' }}
          >
            Let's Start
          </Button>
        </form>

        <Typography sx={{ mt: 3 }}>
          Already have an account? <Link href="/login" sx={{ fontWeight: 'bold', textDecoration: 'none', color: '#a34efe' }}>Sign In</Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default Signup;