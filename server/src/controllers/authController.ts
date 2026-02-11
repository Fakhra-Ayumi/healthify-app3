import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { evaluateBadges } from '../services/badgeEvaluator';

const JWT_SECRET = process.env.JWT_SECRET || 'your_temporary_secret_key';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { 
      firstName, lastName, purpose, 
      threeMonthGoal, threeMonthGoalStatus, 
      weeklyGoal, weeklyGoalStatus,
      streakGoal, currentStreak, profileImage, badges 
    } = req.body;

    // Check if goals are being completed (increment counters)
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    let incWeekly = 0;
    let incThreeMonth = 0;

    if (weeklyGoalStatus === 'completed' && currentUser.weeklyGoalStatus !== 'completed') {
      incWeekly = 1;
    }
    if (threeMonthGoalStatus === 'completed' && currentUser.threeMonthGoalStatus !== 'completed') {
      incThreeMonth = 1;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          firstName, lastName, purpose,
          threeMonthGoal, threeMonthGoalStatus,
          weeklyGoal, weeklyGoalStatus,
          streakGoal, currentStreak, profileImage, badges
        },
        $inc: {
          weeklyGoalCompletions: incWeekly,
          threeMonthGoalCompletions: incThreeMonth
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    // Evaluate badges
    if (updatedUser) {
      const finalUser = await evaluateBadges(userId);
      console.log(`User Updated: ${finalUser?.username}`);
      return res.json(finalUser);
    }
    
    // Fallback if update fails/returns null (shouldn't happen with findByIdAndUpdate success)
    res.json(updatedUser);

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    // Verify if user already exists by email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT token for immediate login after registration
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`User Registered: ${username}`);
    res.status(201).json({ token, user: { id: newUser._id, username: newUser.username } });
  } 
  catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare entered password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`User Logged In: ${username}`);
    res.json({ token, user: { id: user._id, username: user.username } });
  } 
  catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};