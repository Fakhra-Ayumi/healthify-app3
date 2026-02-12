import { Router } from "express";
import { Badge } from "../models/Badge";

const router = Router();

// Get all badges (catalog)
router.get("/", async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: "Error fetching badges" });
  }
});

// Seed badges 
router.post("/seed", async (req, res) => {
  try {
    // Clear existing badges first
    await Badge.deleteMany({});

    const badges = [
      // Weekly Goals
      {
        name: "Weekly Bronze",
        description: "Available Weekly Goal Twice",
        icon: "EmojiEvents",
        criteriaType: "weekly_goal",
        criteriaValue: 2,
        tier: "bronze",
      },
      {
        name: "Weekly Silver",
        description: "Available Weekly Goal 6 Times",
        icon: "EmojiEvents",
        criteriaType: "weekly_goal",
        criteriaValue: 6,
        tier: "silver",
      },
      {
        name: "Weekly Gold",
        description: "Available Weekly Goal 10 Times",
        icon: "EmojiEvents",
        criteriaType: "weekly_goal",
        criteriaValue: 10,
        tier: "gold",
      },

      // 3-Month Goals
      {
        name: "3-Month Bronze",
        description: "Achieve 3-Month Goal Once",
        icon: "EmojiEvents",
        criteriaType: "three_month_goal",
        criteriaValue: 1,
        tier: "bronze",
      },
      {
        name: "3-Month Silver",
        description: "Achieve 3-Month Goal Twice",
        icon: "EmojiEvents",
        criteriaType: "three_month_goal",
        criteriaValue: 2,
        tier: "silver",
      },
      {
        name: "3-Month Gold",
        description: "Achieve 3-Month Goal 3 Times",
        icon: "EmojiEvents",
        criteriaType: "three_month_goal",
        criteriaValue: 3,
        tier: "gold",
      },

      // Streak Goals (20-day challenge completions)
      {
        name: "Streak Bronze",
        description: "Complete 20-day challenge once",
        icon: "SelfImprovement",
        criteriaType: "streak",
        criteriaValue: 1,
        tier: "bronze",
      },
      {
        name: "Streak Silver",
        description: "Complete 20-day challenge twice",
        icon: "SelfImprovement",
        criteriaType: "streak",
        criteriaValue: 2,
        tier: "silver",
      },
      {
        name: "Streak Gold",
        description: "Complete 20-day challenge 3 times",
        icon: "SelfImprovement",
        criteriaType: "streak",
        criteriaValue: 3,
        tier: "gold",
      },
    ];

    await Badge.insertMany(badges);
    res.json({ message: "Badges seeded" });
  } catch (error) {
    res.status(500).json({ message: "Error seeding badges" });
  }
});

export default router;
