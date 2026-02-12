import express from "express";
import request from "supertest";
import authRoutes from "../src/routes/authRoutes";
import workoutRoutes from "../src/routes/workoutRoutes";
import badgeRoutes from "../src/routes/badgeRoutes";

// Build a test Express app identical to the real server
export const app = express();
app.use(express.json({ limit: "5mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/badges", badgeRoutes);

// Default test user credentials
export const testUser = {
  firstName: "Test",
  lastName: "User",
  email: "test@healthify.com",
  confirmEmail: "test@healthify.com",
  username: "testuser",
  password: "Password123",
  confirmPassword: "Password123",
};

// Register + login a user and return { token, userId }
export async function registerAndLogin(
  overrides: Record<string, string> = {},
): Promise<{ token: string; userId: string }> {
  const user = { ...testUser, ...overrides };
  await request(app).post("/api/auth/register").send(user);
  const res = await request(app).post("/api/auth/login").send({
    username: user.username,
    password: user.password,
  });
  return { token: res.body.token, userId: res.body.user.id };
}
