import { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchUserProfile, type UserProfile } from "../services/userService";
import {
  fetchWorkoutHistory,
  type WorkoutLogEntry,
} from "../services/routineService";

const Milestones = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<WorkoutLogEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      try {
        const [userData, historyData] = await Promise.all([
          fetchUserProfile(),
          fetchWorkoutHistory(14),
        ]);
        setUser(userData);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to load milestones data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Weekly Progress Data (past 14 days, most recent first) ---
  const getWeeklyProgressData = () => {
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data = [];
    const completions = user.dailyCompletions ?? {};

    for (let i = 0; i <= 13; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayNum = d.getDate();
      const isToday = i === 0;
      const pct = completions[dateKey] as number | undefined;

      data.push({ date: d, dayNum, pct: pct ?? null, isToday });
    }
    return data;
  };

  // --- Line Chart Data: past 14 days with daily sums per parameter ---
  const getLineChartData = (parameterType: string, targetUnit: string) => {
    const conversionFactors: Record<string, Record<string, number>> = {
      Weight: { kg: 1, g: 0.001, lb: 0.453592 },
      Distance: { km: 1, m: 0.001, mi: 1.60934 },
      Speed: { "km/h": 1, "m/s": 3.6, mph: 1.60934 },
      Time: { h: 1, min: 1 / 60, s: 1 / 3600 },
    };

    const relevantLogs = history.filter((h) => h.parameter === parameterType);
    if (!relevantLogs.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // One data point per day for the past 14 days (oldest → newest)
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;

      let total = 0;
      relevantLogs.forEach((log) => {
        const logDate = new Date(log.date).toISOString().slice(0, 10);
        if (logDate === dateStr) {
          const factor =
            conversionFactors[parameterType]?.[log.unit.toLowerCase()] ?? 1;
          total += log.value * factor;
        }
      });

      data.push({
        name: label,
        value: parseFloat(total.toFixed(2)),
        unit: targetUnit,
      });
    }

    return data;
  };

  // --- Pie Chart Data Preparation ---
  // Calculate improvement rate: (Week 2 Avg - Week 1 Avg) / Week 1 Avg
  const getImprovementData = () => {
    if (!history.length) return [];

    const parameters = ["Weight", "Distance", "Speed", "Time"];
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const results = [];

    for (const param of parameters) {
      const logs = history.filter((h) => h.parameter === param);
      if (!logs.length) continue;

      const week1Logs = logs.filter((h) => new Date(h.date) < oneWeekAgo);
      const week2Logs = logs.filter((h) => new Date(h.date) >= oneWeekAgo);

      const avg1 = week1Logs.length
        ? week1Logs.reduce((acc, c) => acc + c.value, 0) / week1Logs.length
        : 0;
      const avg2 = week2Logs.length
        ? week2Logs.reduce((acc, c) => acc + c.value, 0) / week2Logs.length
        : 0;

      if (avg1 > 0) {
        const improvement = ((avg2 - avg1) / avg1) * 100;
        if (improvement > 0) {
          results.push({ name: param, value: improvement });
        }
      } else if (avg2 > 0) {
        results.push({ name: param, value: 100 });
      }
    }
    return results;
  };

  const weeklyData = getWeeklyProgressData();
  const pieData = getImprovementData();
  const COLORS = ["#a34efe", "#b975fe", "#cf9cfe", "#e5c3fe"];

  if (!mounted) return null; // Avoid rehydration mismatches if any

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: "#a34efe" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4, width: "100%", maxWidth: "md", mx: "auto" }}>
      <Typography
        variant="h6"
        sx={{ textAlign: "center", color: "grey", fontWeight: "bold" }}
      >
        Healthify
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          mb: 3,
          textAlign: "center",
          fontStyle: "italic",
          color: "#000",
        }}
      >
        Milestones
      </Typography>

      {/* Weekly Progress Section */}
      <Typography
        variant="h5"
        sx={{ mb: 1, fontWeight: "bold", color: "#000" }}
      >
        Weekly Progress
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Displays your completion rate of daily workouts over the past 2 weeks.
        Scroll to see today's progress highlighted.
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 2,
          overflowX: "auto",
          backgroundColor: "#e0c6fe",
          borderColor: "#000",
          borderWidth: 1.5,
          borderStyle: "solid",
        }}
      >
        <Box sx={{ display: "flex", minWidth: "100%", pb: 0 }}>
          {weeklyData.map((day, i) => {
            // Determine circle color and label
            const isMissed = day.pct === null && !day.isToday;
            const isLow = day.pct !== null && day.pct < 20;

            let bgColor = "#f5f5f5";
            let textColor = "#000";
            let label = "";

            if (day.isToday && day.pct === null) {
              // Today with no record yet
              bgColor = "#f5f5f5";
            } else if (isMissed) {
              bgColor = "#aaa";
              textColor = "#fff";
            } else if (day.pct !== null) {
              if (isLow) {
                bgColor = "rgb(239, 83, 80)";
                textColor = "#fff";
              } else if (day.pct >= 100) {
                bgColor = "#c2e4ff";
              } else {
                bgColor = "#fff9c4";
              }
              label = `${day.pct}%`;
            }

            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 60,
                  mx: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: bgColor,
                    border:
                      day.isToday && day.pct === null
                        ? "1px dashed #ccc"
                        : "none",
                  }}
                >
                  {isMissed ? (
                    <CloseIcon sx={{ color: "#fff", fontSize: 16 }} />
                  ) : label ? (
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: "bold",
                        color: textColor,
                        lineHeight: 1,
                      }}
                    >
                      {label}
                    </Typography>
                  ) : null}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    fontWeight: "bold",
                    color: "#000",
                    fontSize: "0.9rem",
                  }}
                >
                  {`${day.date.getMonth() + 1}/${day.dayNum}`}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Activity Tracker Section */}
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            mb: 0.5,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#000" }}>
            Activity Tracker
          </Typography>
          {user?.commitmentStartDate && (
            <Typography variant="body2" sx={{ color: "grey" }}>
              Since {new Date(user.commitmentStartDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Daily sum of your weight, distance, speed, and time from routines you
          have completed.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {Object.entries({
            Weight: "kg",
            Distance: "km",
            Speed: "km/h",
            Time: "h",
          }).map(([param, unit]) => {
            const data = getLineChartData(param, unit);
            if (data.length === 0) return null;

            return (
              <Box key={param}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: 300,
                    bgcolor: "#e0c6fe",
                    borderColor: "#000",
                    borderWidth: 1.5,
                    borderStyle: "solid",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    align="center"
                  >
                    {param} Progress
                  </Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#000" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#000", fontWeight: "bold" }}
                        stroke="#000"
                      />
                      <YAxis
                        tick={{ fill: "#000", fontWeight: "bold" }}
                        stroke="#000"
                        tickFormatter={(value) => `${value} ${unit}`}
                      />
                      <RechartsTooltip
                        isAnimationActive={false}
                        formatter={(value, _name, props) => [
                          `${value} ${props.payload.unit}`,
                          param,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#000"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Improvement Rate Distribution Section */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#000", mb: 0.5 }}
        >
          Improvement Rate Distribution
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Compares your week-over-week averages to show where you improved the
          most.
        </Typography>

        {pieData.length > 0 ? (
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "#e0c6fe",
              borderColor: "#000",
              borderWidth: 1.5,
              borderStyle: "solid",
            }}
          >
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    label={(props) => {
                      const { name, percent, x, y, cx } = props;
                      if (!name || percent === undefined) return "";
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#000"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                        >
                          {`${name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#000"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip isAnimationActive={false} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "#000", fontWeight: "bold" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        ) : !loading ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              Complete workouts for at least 1 day to see improvement analytics
              for 2 weeks of weight, distance, speed and time.
            </Typography>
          </Paper>
        ) : null}
      </Box>
    </Box>
  );
};

export default Milestones;
