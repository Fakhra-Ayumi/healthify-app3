import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import { app, testUser, registerAndLogin } from "../helpers";
import { User } from "../../src/models/User";

describe("Integration: Profile — Get & Update", () => {
  let token: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();
    const auth = await registerAndLogin();
    token = auth.token;
  });

  it("should fetch profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.username).to.equal("testuser");
    expect(res.body.firstName).to.equal("Test");
    expect(res.body).to.not.have.property("password");
  });

  it("should update only specified fields (partial update)", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ purpose: "Build muscle" });
    expect(res.status).to.equal(200);
    expect(res.body.purpose).to.equal("Build muscle");
    expect(res.body.firstName).to.equal("Test"); // not wiped
  });

  it("should preserve goal descriptions after updating another field", async () => {
    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoal: "Run 5k three times" });

    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ purpose: "Stay healthy" });

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.weeklyGoal).to.equal("Run 5k three times");
    expect(res.body.purpose).to.equal("Stay healthy");
  });

  it("should preserve threeMonthGoal when updating weeklyGoal", async () => {
    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ threeMonthGoal: "Lose 10 pounds" });

    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoal: "Run 10k" });

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.threeMonthGoal).to.equal("Lose 10 pounds");
    expect(res.body.weeklyGoal).to.equal("Run 10k");
  });

  it("should update profile image", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ profileImage: "data:image/png;base64,fakedata" });
    expect(res.status).to.equal(200);
    expect(res.body.profileImage).to.equal("data:image/png;base64,fakedata");
  });

  it("should update firstName", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Ayumi" });
    expect(res.status).to.equal(200);
    expect(res.body.firstName).to.equal("Ayumi");
  });
});

describe("Integration: Goal Status & Completion Counters", () => {
  let token: string;
  let userId: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();
    const auth = await registerAndLogin();
    token = auth.token;
    userId = auth.userId;
  });

  it("should increment weeklyGoalCompletions when status set to completed", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalStatus: "completed" });
    expect(res.status).to.equal(200);
    expect(res.body.weeklyGoalStatus).to.equal("completed");
    expect(res.body.weeklyGoalCompletions).to.equal(1);
  });

  it("should NOT double-increment when already completed", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalStatus: "completed" });
    expect(res.body.weeklyGoalCompletions).to.equal(1);
  });

  it("should allow resetting + re-completing to increment again", async () => {
    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalStatus: "not_started" });

    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalStatus: "completed" });
    expect(res.body.weeklyGoalCompletions).to.equal(2);
  });

  it("should increment threeMonthGoalCompletions on completion", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ threeMonthGoalStatus: "completed" });
    expect(res.body.threeMonthGoalCompletions).to.equal(1);
  });
});

describe("Integration: Goal Lock-In", () => {
  let token: string;
  let userId: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();
    const auth = await registerAndLogin();
    token = auth.token;
    userId = auth.userId;
  });

  it("should set weeklyGoalLockIn and increment counter", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalLockIn: new Date().toISOString() });
    expect(res.status).to.equal(200);
    expect(res.body.weeklyGoalLockIn).to.not.be.null;
    expect(res.body.weeklyGoalLockInCount).to.equal(1);
  });

  it("should NOT double-increment lock-in when already locked", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalLockIn: new Date().toISOString() });
    expect(res.body.weeklyGoalLockInCount).to.equal(1);
  });

  it("should set threeMonthGoalLockIn and increment counter", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ threeMonthGoalLockIn: new Date().toISOString() });
    expect(res.body.threeMonthGoalLockIn).to.not.be.null;
    expect(res.body.threeMonthGoalLockInCount).to.equal(1);
  });
});
