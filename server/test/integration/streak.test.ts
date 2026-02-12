import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { app, registerAndLogin } from '../helpers';
import { User } from '../../src/models/User';
import { Workout } from '../../src/models/Workout';

describe('Integration: Streak Logic', () => {
  let token: string;
  let userId: string;
  let workoutId: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();

    const auth = await registerAndLogin();
    token = auth.token;
    userId = auth.userId;

    // Reset streak fields to a clean state
    await User.findByIdAndUpdate(userId, {
      $set: {
        currentStreak: 0,
        lastActiveDate: null,
        streakCompletions: 0,
        streakDates: [],
      },
    });

    // Create a workout to complete
    const createRes = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ day: 'Tuesday', title: 'Leg Day', activities: [] });
    workoutId = createRes.body._id;
  });

  // helper: complete the workout with "Done for Today"
  const completeWorkout = async () => {
    await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Tuesday',
        title: 'Leg Day',
        activities: [],
        lastCompletedDate: new Date().toISOString(),
      });
  };

  const getProfile = () =>
    request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

  it('should start streak at 1 on first workout completion', async () => {
    await completeWorkout();
    const res = await getProfile();
    expect(res.body.currentStreak).to.equal(1);
  });

  it('should NOT increment streak when completing same day again', async () => {
    await completeWorkout();
    const res = await getProfile();
    expect(res.body.currentStreak).to.equal(1); // still 1
  });

  it('should increment streak on consecutive-day completion', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await User.findByIdAndUpdate(userId, {
      $set: { lastActiveDate: yesterday, currentStreak: 1 },
    });

    await completeWorkout();
    const res = await getProfile();
    expect(res.body.currentStreak).to.equal(2);
  });

  it('should reset streak to 1 when gap > 1 day', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await User.findByIdAndUpdate(userId, {
      $set: { lastActiveDate: threeDaysAgo, currentStreak: 5 },
    });

    await completeWorkout();
    const res = await getProfile();
    expect(res.body.currentStreak).to.equal(1);
  });

  it('should complete 20-day challenge and increment streakCompletions', async () => {
    // Set commitmentStartDate far enough back so daysSinceStart >= 20
    const twentyFiveDaysAgo = new Date();
    twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await User.findByIdAndUpdate(userId, {
      $set: {
        currentStreak: 19,
        lastActiveDate: yesterday,
        commitmentStartDate: twentyFiveDaysAgo,
        streakCompletions: 0,
      },
    });

    await completeWorkout();
    const res = await getProfile();
    // After reaching 20, streak resets to 0 and streakCompletions increments
    expect(res.body.currentStreak).to.equal(0);
    expect(res.body.streakCompletions).to.be.at.least(1);
  });

  after(async () => {
    if (workoutId) await Workout.findByIdAndDelete(workoutId);
  });
});
