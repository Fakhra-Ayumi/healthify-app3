import express from "express";
import cors from "cors";
import connectDB from "./db";
import authRoutes from "./routes/authRoutes";
import workoutRoutes from "./routes/workoutRoutes";
import badgeRoutes from "./routes/badgeRoutes";

const app = express();
const PORT = process.env.PORT || 8000;

connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/badges", badgeRoutes);

app.get("/", (req, res) => {
  res.send("Healthify API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
