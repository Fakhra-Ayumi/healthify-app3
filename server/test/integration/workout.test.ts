import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { app, registerAndLogin } from '../helpers';
import { Workout } from '../../src/models/Workout';

describe('Integration: Workout CRUD', () => {
  let token: string;
  let workoutId: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();
    const auth = await registerAndLogin();
    token = auth.token;
  });

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

  it('should fetch all workouts for the user', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').with.length.at.least(1);
  });

  it('should update a workout title and activities', async () => {
    const res = await request(app)
      .put(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        day: 'Monday',
        title: 'Upper Body',
        activities: [
          {
            name: 'Bench Press',
            sets: [{ parameter: 'Weight', value: 65, unit: 'kg', status: 'none' }],
          },
        ],
      });
    expect(res.status).to.equal(200);
    expect(res.body.title).to.equal('Upper Body');
  });

  it('should mark a workout as completed (Done for Today)', async () => {
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

describe('Integration: Workout Auto-Reset (Midnight Rule)', () => {
  let token: string;
  let workoutId: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();
    const auth = await registerAndLogin();
    token = auth.token;
  });

  it('should NOT reset a workout completed today', async () => {
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

    // Mark completed right now
    await Workout.findByIdAndUpdate(workoutId, { lastCompletedDate: new Date() });

    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);
    const w = res.body.find((w: any) => w._id === workoutId);
    expect(w.lastCompletedDate).to.not.be.null;
  });

  it('should reset a workout completed yesterday (past midnight)', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);

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

    expect(w.lastCompletedDate).to.be.null;
    expect(w.activities[0].sets[0].status).to.equal('incomplete');
    expect(w.activities[0].sets[0].value).to.equal(17);
    expect(w.activities[0].sets[0].suggestionApplied).to.equal(true);
  });

  after(async () => {
    if (workoutId) await Workout.findByIdAndDelete(workoutId);
  });
});

describe('Integration: User Isolation', () => {
  let token1: string;
  let token2: string;
  let workoutId: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();

    const auth1 = await registerAndLogin();
    token1 = auth1.token;

    const auth2 = await registerAndLogin({
      firstName: 'Other',
      lastName: 'Person',
      email: 'other@healthify.com',
      confirmEmail: 'other@healthify.com',
      username: 'otheruser',
    });
    token2 = auth2.token;
  });

  it('workouts from one user should not be visible to another', async () => {
    const w = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({ day: 'Friday', title: 'User1 Only', activities: [] });
    workoutId = w.body._id;

    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token2}`);
    const titles = res.body.map((w: any) => w.title);
    expect(titles).to.not.include('User1 Only');
  });

  after(async () => {
    if (workoutId) await Workout.findByIdAndDelete(workoutId);
  });
});
