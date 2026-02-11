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

    // Check if goals are being completed (increment counters)
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    let incWeekly = 0;
    let incThreeMonth = 0;
    let incWeeklyLockIn = 0;
    let incThreeMonthLockIn = 0;

    if (req.body.weeklyGoalStatus === 'completed' && currentUser.weeklyGoalStatus !== 'completed') {
      incWeekly = 1;
    }
    if (req.body.threeMonthGoalStatus === 'completed' && currentUser.threeMonthGoalStatus !== 'completed') {
      incThreeMonth = 1;
    }
    if (req.body.weeklyGoalLockIn && !currentUser.weeklyGoalLockIn) {
      incWeeklyLockIn = 1;
    }
    if (req.body.threeMonthGoalLockIn && !currentUser.threeMonthGoalLockIn) {
      incThreeMonthLockIn = 1;
    }

    // Build set dynamically — only include fields present in req.body
    const settableFields = [
      'firstName', 'lastName', 'purpose',
      'threeMonthGoal', 'threeMonthGoalStatus',
      'weeklyGoal', 'weeklyGoalStatus',
      'weeklyGoalLockIn', 'threeMonthGoalLockIn', 
      'streakGoal', 'currentStreak', 'profileImage', 'badges',
      'streakDates', 'commitmentStartDate'
    ];
    
    const setObj: Record<string, any> = {};
    for (const key of settableFields) {
      if (req.body[key] !== undefined) {
        setObj[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: setObj,
        $inc: {
          weeklyGoalCompletions: incWeekly,
          threeMonthGoalCompletions: incThreeMonth,
          weeklyGoalLockInCount: incWeeklyLockIn,
          threeMonthGoalLockInCount: incThreeMonthLockIn,
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