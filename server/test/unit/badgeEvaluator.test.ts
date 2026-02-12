import { expect } from "chai";
import mongoose from "mongoose";
import { User } from "../../src/models/User";
import { Badge } from "../../src/models/Badge";
import { evaluateBadges } from "../../src/services/badgeEvaluator";

describe("Unit: Badge Evaluator", () => {
  let userId: string;

  before(async () => {
    await mongoose.connection.dropDatabase();

    // Seed a small set of badges
    await Badge.insertMany([
      {
        name: "Weekly Bronze",
        description: "Complete weekly goal twice",
        icon: "EmojiEvents",
        criteriaType: "weekly_goal",
        criteriaValue: 2,
        tier: "bronze",
      },
      {
        name: "Weekly Silver",
        description: "Complete weekly goal 6 times",
        icon: "EmojiEvents",
        criteriaType: "weekly_goal",
        criteriaValue: 6,
        tier: "silver",
      },
      {
        name: "3-Month Bronze",
        description: "Achieve 3-month goal once",
        icon: "EmojiEvents",
        criteriaType: "three_month_goal",
        criteriaValue: 1,
        tier: "bronze",
      },
      {
        name: "Streak Bronze",
        description: "Complete 20-day challenge once",
        icon: "SelfImprovement",
        criteriaType: "streak",
        criteriaValue: 1,
        tier: "bronze",
      },
    ]);

    const user = await User.create({
      username: "badgeunit",
      firstName: "Badge",
      lastName: "Test",
      email: "badge@unit.com",
      password: "hashedpassword",
    });
    userId = user._id.toString();
  });

  it("should return null for a non-existent user", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const result = await evaluateBadges(fakeId);
    expect(result).to.be.null;
  });

  it("should NOT award any badge when criteria are not met", async () => {
    const user = await evaluateBadges(userId);
    expect(user!.badges).to.be.an("array").that.is.empty;
  });

  it("should award Weekly Bronze when completions >= 2 AND lockIns >= 2", async () => {
    await User.findByIdAndUpdate(userId, {
      weeklyGoalCompletions: 2,
      weeklyGoalLockInCount: 2,
    });
    const user = await evaluateBadges(userId);
    expect(user!.badges).to.include("Weekly Bronze");
  });

  it("should NOT award Weekly Silver when criteria are insufficient", async () => {
    // completions=2, lockIns=2 ─ Silver needs 6
    const user = await evaluateBadges(userId);
    expect(user!.badges).to.not.include("Weekly Silver");
  });

  it("should NOT duplicate an already-earned badge", async () => {
    const user = await evaluateBadges(userId);
    const count = user!.badges.filter(
      (b: string) => b === "Weekly Bronze",
    ).length;
    expect(count).to.equal(1);
  });

  it("should award 3-Month Bronze when completions >= 1 AND lockIns >= 1", async () => {
    await User.findByIdAndUpdate(userId, {
      threeMonthGoalCompletions: 1,
      threeMonthGoalLockInCount: 1,
    });
    const user = await evaluateBadges(userId);
    expect(user!.badges).to.include("3-Month Bronze");
  });

  it("should award Streak Bronze when streakCompletions >= 1", async () => {
    await User.findByIdAndUpdate(userId, { streakCompletions: 1 });
    const user = await evaluateBadges(userId);
    expect(user!.badges).to.include("Streak Bronze");
  });

  it("should award multiple badges in one evaluation pass", async () => {
    const user = await User.findById(userId);
    // At this point Weekly Bronze, 3-Month Bronze, and Streak Bronze should all be present
    expect(user!.badges).to.include.members([
      "Weekly Bronze",
      "3-Month Bronze",
      "Streak Bronze",
    ]);
  });
});
