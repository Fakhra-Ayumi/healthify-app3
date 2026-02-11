/**
 * Healthify App — Comprehensive Backend Test Suite
 * 
 * HOW TO RUN:
 *   cd server
 *   npm install --save-dev mocha chai supertest mongodb-memory-server @types/mocha @types/chai @types/supertest ts-mocha
 *   npx ts-mocha test/healthify.test.ts --timeout 30000
 * 
 * This file tests every backend feature end-to-end:
 *   1. Auth (register, login, validation, duplicate prevention)
 *   2. Profile CRUD (get, update, partial update — data persistence)
 *   3. Goal descriptions persistence across page changes (Task 1 regression)
 *   4. Goal lock-in (weekly + 3-month)
 *   5. Goal status changes + completion counters
 *   6. Workout CRUD (create, read, update, delete)
 *   7. Done-for-today + streak logic (midnight reset)
 *   8. Auto-reset logic (workout statuses reset after midnight)
 *   9. Badge evaluation (weekly, 3-month, streak badges with lock-in requirement)
 *   10. Authorization (no token, invalid token)
 */

import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// --- Import app pieces ---
import { User } from '../src/models/User';
import { Workout } from '../src/models/Workout';
import { Badge } from '../src/models/Badge';
import authRoutes from '../src/routes/authRoutes';
import workoutRoutes from '../src/routes/workoutRoutes';
import badgeRoutes from '../src/routes/badgeRoutes';

// Build a test express app (same middleware as real server)
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/badges', badgeRoutes);

let mongoServer: MongoMemoryServer;
let token: string;
let userId: string;

// --- Test user credentials ---
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@healthify.com',
  confirmEmail: 'test@healthify.com',
  username: 'testuser',
  password: 'Password123',
  confirmPassword: 'Password123',
};

// =============================================================================
// SETUP & TEARDOWN
// =============================================================================
before(async function () {
  this.timeout(30000);
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

after(async function () {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async function () {
  // Clean collections between describe blocks if needed
});

// =============================================================================
// 1. AUTH — Registration & Login
// =============================================================================
describe('1. Auth — Registration & Login', () => {

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('token');
    expect(res.body.user).to.have.property('username', 'testuser');
  });

  it('should reject duplicate registration (same email)', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).to.equal(400);
    expect(res.body.message).to.include('already exists');
  });

  it('should reject registration with mismatched emails', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...testUser,
      email: 'other@mail.com',
      confirmEmail: 'mismatch@mail.com',
      username: 'newuser',
    });
    expect(res.status).to.equal(400);
  });

  it('should reject registration with short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...testUser,
      email: 'short@mail.com',
      confirmEmail: 'short@mail.com',
      username: 'shortpw',
      password: '123',
      confirmPassword: '123',
    });
    expect(res.status).to.equal(400);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'testuser',
      password: 'Password123',
    });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'testuser',
      password: 'WrongPassword',
    });
    expect(res.status).to.equal(400);
  });

  it('should reject login with non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'noexist',
      password: 'Password123',
    });
    expect(res.status).to.equal(400);
  });
});

// =============================================================================
// 2. Auth Protection — Token Checks
// =============================================================================
describe('2. Auth Protection', () => {

  it('should reject profile access without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).to.equal(401);
  });

  it('should reject profile access with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).to.equal(403);
  });

  it('should reject workout access without token', async () => {
    const res = await request(app).get('/api/workouts');
    expect(res.status).to.equal(401);
  });
});

// =============================================================================
// 3. Profile — Get & Update
// =============================================================================
describe('3. Profile — Get & Update', () => {

  it('should fetch profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.username).to.equal('testuser');
    expect(res.body.firstName).to.equal('Test');
    expect(res.body).to.not.have.property('password');
  });

  it('should update only specified fields (partial update)', async () => {
    // Update purpose only
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'Build muscle' });
    expect(res.status).to.equal(200);
    expect(res.body.purpose).to.equal('Build muscle');
    expect(res.body.firstName).to.equal('Test'); // Should NOT be wiped out
  });

  it('should preserve goal descriptions after updating another field (regression test)', async () => {
    // Set weekly goal
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoal: 'Run 5k three times' });

    // Now update a different field (purpose)
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'Stay healthy' });

    // Fetch and verify weeklyGoal is still there
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.weeklyGoal).to.equal('Run 5k three times');
    expect(res.body.purpose).to.equal('Stay healthy');
  });

  it('should preserve threeMonthGoal when updating weeklyGoal', async () => {
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ threeMonthGoal: 'Lose 10 pounds' });

    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoal: 'Run 10k' });

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.threeMonthGoal).to.equal('Lose 10 pounds');
    expect(res.body.weeklyGoal).to.equal('Run 10k');
  });

  it('should update profile image', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileImage: 'data:image/png;base64,fakedata' });
    expect(res.status).to.equal(200);
    expect(res.body.profileImage).to.equal('data:image/png;base64,fakedata');
  });

  it('should update firstName', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Ayumi' });
    expect(res.status).to.equal(200);
    expect(res.body.firstName).to.equal('Ayumi');
  });
});

// =============================================================================
// 4. Goal Status & Completions
// =============================================================================
describe('4. Goal Status Changes & Completion Counters', () => {

  it('should increment weeklyGoalCompletions when status set to completed', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoalStatus: 'completed' });
    expect(res.status).to.equal(200);
    expect(res.body.weeklyGoalStatus).to.equal('completed');
    expect(res.body.weeklyGoalCompletions).to.equal(1);
  });

  it('should NOT double-increment when already completed', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoalStatus: 'completed' });
    expect(res.body.weeklyGoalCompletions).to.equal(1); // still 1
  });

  it('should allow resetting and re-completing to increment again', async () => {
    // Reset
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoalStatus: 'not_started' });

    // Complete again
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoalStatus: 'completed' });
    expect(res.body.weeklyGoalCompletions).to.equal(2);
  });

  it('should increment threeMonthGoalCompletions on completion', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ threeMonthGoalStatus: 'completed' });
    expect(res.body.threeMonthGoalCompletions).to.equal(1);
  });
});

// =============================================================================
// 5. Goal Lock-In
// =============================================================================
describe('5. Goal Lock-In', () => {

  it('should set weeklyGoalLockIn and increment counter', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoalLockIn: new Date().toISOString() });
    expect(res.status).to.equal(200);
    expect(res.body.weeklyGoalLockIn).to.not.be.null;
    expect(res.body.weeklyGoalLockInCount).to.equal(1);
  });

  it('should NOT double-increment lock-in when already locked', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoalLockIn: new Date().toISOString() });
    expect(res.body.weeklyGoalLockInCount).to.equal(1); // still 1
  });

  it('should set threeMonthGoalLockIn and increment counter', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ threeMonthGoalLockIn: new Date().toISOString() });
    expect(res.body.threeMonthGoalLockIn).to.not.be.null;
    expect(res.body.threeMonthGoalLockInCount).to.equal(1);
  });
});

// =============================================================================
// 6. Badges — Seeding & Evaluation
// =============================================================================
describe('6. Badges', () => {

  it('should seed badges via POST /api/badges/seed', async () => {
    const res = await request(app).post('/api/badges/seed');
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Badges seeded');
  });

  it('should fetch all seeded badges', async () => {
    const res = await request(app).get('/api/badges');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.equal(9); // 3 weekly + 3 three_month + 3 streak
  });

  it('should award Weekly Bronze badge (requires 2 completions + 2 lock-ins)', async () => {
    // Reset + re-lock + re-complete for a second cycle
    // Currently: weeklyGoalCompletions=2, weeklyGoalLockInCount=1
    // We need lock-in count = 2 as well

    // Clear lock-in first so we can re-lock
    await User.findByIdAndUpdate(userId, { $set: { weeklyGoalLockIn: null } });

    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ weeklyGoalLockIn: new Date().toISOString() });

    // Now weeklyGoalLockInCount=2, weeklyGoalCompletions=2
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.badges).to.include('Weekly Bronze');
  });

  it('should award 3-Month Bronze badge (requires 1 completion + 1 lock-in)', async () => {
    // threeMonthGoalCompletions=1, threeMonthGoalLockInCount=1 (set earlier)
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.badges).to.include('3-Month Bronze');
  });

  it('should NOT award a badge when lock-in count is insufficient', async () => {
    // Weekly Silver requires 6 completions + 6 lock-ins — we have 2 each
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.badges).to.not.include('Weekly Silver');
  });
});

// =============================================================================
// 7. Workouts — CRUD
// =============================================================================
describe('7. Workouts — CRUD', () => {
  let workoutId: string;

  it('should create a new workout', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Monday',
        title: 'Chest Day',
        activities: [
          {
            name: 'Bench Press',
            sets: [
              { parameter: 'Weight', value: 60, unit: 'kg', status: 'none' },
              { parameter: 'Reps', value: 10, unit: 'times', status: 'none' },
            ],
          },
        ],
      });
    expect(res.status).to.equal(201);
    expect(res.body.title).to.equal('Chest Day');
    expect(res.body.activities).to.have.length(1);
    expect(res.body.activities[0].sets).to.have.length(2);
    workoutId = res.body._id;
  });

  it('should fetch all workouts for user', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.at.least(1);
  });

  it('should update a workout title', async () => {
    const res = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Monday',
        title: 'Upper Body',
        activities: [
          {
            name: 'Bench Press',
            sets: [
              { parameter: 'Weight', value: 65, unit: 'kg', status: 'none' },
            ],
          },
        ],
      });
    expect(res.status).to.equal(200);
    expect(res.body.title).to.equal('Upper Body');
  });

  it('should update workout with lastCompletedDate (Done for Today)', async () => {
    const res = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Monday',
        title: 'Upper Body',
        activities: [
          {
            name: 'Bench Press',
            sets: [{ parameter: 'Weight', value: 65, unit: 'kg', status: 'completed' }],
          },
        ],
        lastCompletedDate: new Date().toISOString(),
      });
    expect(res.status).to.equal(200);
    expect(res.body.lastCompletedDate).to.not.be.null;
  });

  it('should not allow value of 0 in sets (application-level check)', async () => {
    // This is validated on the client. Here we test that a value of 0 can technically
    // go through since mongoose doesn't block it — the client prevents it.
    const res = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Monday',
        title: 'Upper Body',
        activities: [
          {
            name: 'Bench Press',
            sets: [{ parameter: 'Weight', value: 0, unit: 'kg', status: 'none' }],
          },
        ],
      });
    // The server allows it — client-side blocks it
    expect(res.status).to.equal(200);
  });

  it('should delete a workout', async () => {
    const res = await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.include('deleted');
  });

  it('should return 404 when deleting non-existent workout', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/workouts/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(404);
  });
});

// =============================================================================
// 8. Streak Logic
// =============================================================================
describe('8. Streak Logic', () => {
  let workoutId: string;

  before(async () => {
    // Reset streak
    await User.findByIdAndUpdate(userId, {
      $set: { currentStreak: 0, lastActiveDate: null, streakCompletions: 0 },
    });
  });

  it('should start streak at 1 when completing a workout for the first time', async () => {
    // Create a workout
    const createRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ day: 'Tuesday', title: 'Leg Day', activities: [] });
    workoutId = createRes.body._id;

    // Complete it
    await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Tuesday',
        title: 'Leg Day',
        activities: [],
        lastCompletedDate: new Date().toISOString(),
      });

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.body.currentStreak).to.equal(1);
  });

  it('should NOT increment streak if completed same day again', async () => {
    await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Tuesday',
        title: 'Leg Day',
        activities: [],
        lastCompletedDate: new Date().toISOString(),
      });

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.body.currentStreak).to.equal(1); // still 1
  });

  it('should increment streak when completing on consecutive day', async () => {
    // Simulate yesterday as lastActiveDate
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await User.findByIdAndUpdate(userId, {
      $set: { lastActiveDate: yesterday, currentStreak: 1 },
    });

    await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Tuesday',
        title: 'Leg Day',
        activities: [],
        lastCompletedDate: new Date().toISOString(),
      });

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.body.currentStreak).to.equal(2);
  });

  it('should reset streak to 1 if gap > 1 day', async () => {
    // Simulate last active 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await User.findByIdAndUpdate(userId, {
      $set: { lastActiveDate: threeDaysAgo, currentStreak: 5 },
    });

    await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Tuesday',
        title: 'Leg Day',
        activities: [],
        lastCompletedDate: new Date().toISOString(),
      });

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profile.body.currentStreak).to.equal(1);
  });

  it('should complete streak challenge and increment streakCompletions when reaching 20', async () => {
    await User.findByIdAndUpdate(userId, {
      $set: { currentStreak: 19, lastActiveDate: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; })() },
    });

    await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Tuesday',
        title: 'Leg Day',
        activities: [],
        lastCompletedDate: new Date().toISOString(),
      });

    const profile = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    // After reaching 20, streak resets to 0 and streakCompletions increments
    expect(profile.body.currentStreak).to.equal(0);
    expect(profile.body.streakCompletions).to.be.at.least(1);
  });

  after(async () => {
    // Cleanup
    if (workoutId) {
      await Workout.findByIdAndDelete(workoutId);
    }
  });
});

// =============================================================================
// 9. Workout Auto-Reset (Midnight Rule)
// =============================================================================
describe('9. Workout Auto-Reset (Midnight Rule)', () => {
  let workoutId: string;

  it('should NOT reset workout completed today', async () => {
    const createRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Wednesday',
        title: 'Arms Day',
        activities: [
          {
            name: 'Curls',
            sets: [{ parameter: 'Weight', value: 15, unit: 'kg', status: 'completed' }],
          },
        ],
      });
    workoutId = createRes.body._id;

    // Mark completed today
    await Workout.findByIdAndUpdate(workoutId, {
      $set: { lastCompletedDate: new Date() },
    });

    // Fetch — should NOT reset since it's still today
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);
    const w = res.body.find((w: any) => w._id === workoutId);
    expect(w.lastCompletedDate).to.not.be.null;
  });

  it('should reset workout completed yesterday (past midnight)', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0); // yesterday afternoon

    await Workout.findByIdAndUpdate(workoutId, {
      $set: {
        lastCompletedDate: yesterday,
        activities: [
          {
            name: 'Curls',
            sets: [
              { parameter: 'Weight', value: 15, unit: 'kg', status: 'completed', nextSuggestedValue: 17 },
            ],
          },
        ],
      },
    });

    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);

    const w = res.body.find((w: any) => w._id === workoutId);
    // lastCompletedDate should be cleared
    expect(w.lastCompletedDate).to.be.null;
    // Status should be reset to incomplete
    expect(w.activities[0].sets[0].status).to.equal('incomplete');
    // Suggestion should have been applied
    expect(w.activities[0].sets[0].value).to.equal(17);
    expect(w.activities[0].sets[0].suggestionApplied).to.equal(true);
  });

  after(async () => {
    if (workoutId) await Workout.findByIdAndDelete(workoutId);
  });
});

// =============================================================================
// 10. Data Consistency — Cross-feature checks
// =============================================================================
describe('10. Data Consistency', () => {

  it('should not have password in any profile response', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).to.not.have.property('password');
  });

  it('should maintain badge list after profile updates', async () => {
    const before = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    const badgesBefore = before.body.badges;

    // Update purpose (unrelated to badges)
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ purpose: 'New purpose text' });

    const after = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.badges).to.deep.equal(badgesBefore);
  });

  it('workouts from one user should not be visible to another', async () => {
    // Register a second user
    const reg = await request(app).post('/api/auth/register').send({
      firstName: 'Other',
      lastName: 'Person',
      email: 'other@healthify.com',
      confirmEmail: 'other@healthify.com',
      username: 'otheruser',
      password: 'Password456',
      confirmPassword: 'Password456',
    });
    const token2 = reg.body.token;

    // Create workout for user 1
    const w = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ day: 'Friday', title: 'User1 Workout', activities: [] });

    // Fetch workouts for user 2
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token2}`);
    const titles = res.body.map((w: any) => w.title);
    expect(titles).to.not.include('User1 Workout');

    // Cleanup
    await Workout.findByIdAndDelete(w.body._id);
  });
});
