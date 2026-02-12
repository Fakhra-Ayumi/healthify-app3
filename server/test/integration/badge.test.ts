import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import { app, registerAndLogin } from "../helpers";
import { User } from "../../src/models/User";

describe("Integration: Badge System", () => {
  let token: string;
  let userId: string;

  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();

    const auth = await registerAndLogin();
    token = auth.token;
    userId = auth.userId;
  });

  it("should seed badges via POST /api/badges/seed", async () => {
    const res = await request(app).post("/api/badges/seed");
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Badges seeded");
  });

  it("should fetch all seeded badges (9 total)", async () => {
    const res = await request(app).get("/api/badges");
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
    expect(res.body.length).to.equal(9);
  });

  it("should award Weekly Bronze badge (completions >= 2, lockIns >= 2)", async () => {
    // Set completions to 2
    await User.findByIdAndUpdate(userId, {
      $set: { weeklyGoalCompletions: 2, weeklyGoalLockIn: null },
    });

    // First lock-in
    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalLockIn: new Date().toISOString() });

    // Clear lock-in to test second time
    await User.findByIdAndUpdate(userId, { $set: { weeklyGoalLockIn: null } });

    // Second lock-in
    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ weeklyGoalLockIn: new Date().toISOString() });

    // Now weeklyGoalLockInCount=2, weeklyGoalCompletions=2
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.badges).to.include("Weekly Bronze");
  });

  it("should award 3-Month Bronze badge (completions >= 1, lockIns >= 1)", async () => {
    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        threeMonthGoalStatus: "completed",
        threeMonthGoalLockIn: new Date().toISOString(),
      });

    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.badges).to.include("3-Month Bronze");
  });

  it("should NOT award a badge when criteria are insufficient", async () => {
    // Weekly Silver needs 6 — user only has 2
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.badges).to.not.include("Weekly Silver");
  });

  it("should maintain badge list after unrelated profile updates", async () => {
    const before = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    const badgesBefore = before.body.badges;

    await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ purpose: "New purpose text" });

    const after = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(after.body.badges).to.deep.equal(badgesBefore);
  });
});
