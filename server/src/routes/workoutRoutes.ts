// Connecting the controller actions through API endpoints
import { Router } from 'express';
import { getWorkouts, createWorkout, updateWorkout, deleteWorkout } from '../controllers/workoutController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

router.get('/', getWorkouts);
router.post('/', createWorkout);
router.put('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);

export default router;
