import axios from 'axios';
import { Workout } from '../types/workout';

const API_URL = 'http://localhost:8000/api/workouts';

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const fetchWorkouts = async (): Promise<Workout[]> => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

export const createWorkout = async (workout: Workout): Promise<Workout> => {
  const response = await axios.post(API_URL, workout, getAuthHeader());
  return response.data;
};

export const updateWorkoutService = async (id: string, workout: Workout): Promise<Workout> => {
  const response = await axios.put(`${API_URL}/${id}`, workout, getAuthHeader());
  return response.data;
};

export const deleteWorkoutService = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, getAuthHeader());
};