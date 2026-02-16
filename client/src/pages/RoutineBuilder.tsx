import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { Workout } from "../types/workout";
import MenuCard from "../components/MenuCard";
import {
  fetchWorkouts,
  createWorkout,
  updateWorkoutService,
  deleteWorkoutService,
} from "../services/routineService";

const RoutineBuilder: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);

  /* Load workouts from server on mount */
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const data = await fetchWorkouts();
        setWorkouts(data);
      } catch (err) {
        console.error("Failed to load workouts:", err);
      }
    };
    loadWorkouts();
  }, []);

  // Separate daily menus from special menus
  const dailyMenus = workouts.filter((w) => !w.isSpecial);
  const specialMenus = workouts.filter((w) => w.isSpecial);

  const handleAddMenu = async () => {
    // Enforce 7-daily-menu limit on the client side
    if (dailyMenus.length >= 7) {
      setLimitDialogOpen(true);
      return;
    }

    const newWorkout: Workout = {
      day: getDayName(dailyMenus.length),
      title: "Menu Title",
      activities: [],
    };

    const timestamp = new Date().getTime();
    const tempId = `temp-${timestamp}`;
    const optimisticWorkout = { ...newWorkout, _id: tempId } as Workout;
    setWorkouts((prev) => [...prev, optimisticWorkout]);
    setExpandedMenuId(tempId);

    try {
      const savedWorkout = await createWorkout(newWorkout);
      setWorkouts((prev) =>
        prev.map((w) => (w._id === tempId ? savedWorkout : w)),
      );
      if (savedWorkout._id) setExpandedMenuId(savedWorkout._id);
    } catch (err) {
      console.error("Failed to add workout:", err);
      setWorkouts((prev) => prev.filter((w) => w._id !== tempId));
      setExpandedMenuId(null);
    }
  };

  const handleAddSpecialMenu = async () => {
    const newWorkout: Workout = {
      day: "Special",
      title: "Special Menu",
      isSpecial: true,
      activities: [],
    };

    const timestamp = new Date().getTime();
    const tempId = `temp-special-${timestamp}`;
    const optimisticWorkout = { ...newWorkout, _id: tempId } as Workout;
    setWorkouts((prev) => [...prev, optimisticWorkout]);
    setExpandedMenuId(tempId);

    try {
      const savedWorkout = await createWorkout(newWorkout);
      setWorkouts((prev) =>
        prev.map((w) => (w._id === tempId ? savedWorkout : w)),
      );
      if (savedWorkout._id) setExpandedMenuId(savedWorkout._id);
    } catch (err) {
      console.error("Failed to add special workout:", err);
      setWorkouts((prev) => prev.filter((w) => w._id !== tempId));
      setExpandedMenuId(null);
    }
  };

  const handleUpdateWorkout = async (workoutId: string, updated: Workout) => {
    setWorkouts((prev) => prev.map((w) => (w._id === workoutId ? updated : w)));

    try {
      if (workoutId && !workoutId.startsWith("temp")) {
        await updateWorkoutService(workoutId, updated);
      }
    } catch (err) {
      console.error("Failed to update workout:", err);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    setWorkouts((prev) => prev.filter((w) => w._id !== workoutId));

    try {
      if (workoutId && !workoutId.startsWith("temp")) {
        await deleteWorkoutService(workoutId);
      }
    } catch (err) {
      console.error("Failed to delete workout:", err);
    }
  };

  const getDayName = (index: number): string => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return days[index % 7];
  };

  const handleDoneForToday = (workout: Workout) => {
    if (!workout._id) return;
    const updated = { ...workout, lastCompletedDate: new Date().toISOString() };
    handleUpdateWorkout(workout._id, updated);
  };

  return (
    <Box sx={{ pb: 2, width: "100%", maxWidth: "md", mx: "auto" }}>
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
        Routine Builder
      </Typography>

      {/* Daily Menu Cards */}
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", mb: 0.5, color: "#000" }}
        >
          Daily Menu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Your weekly daily menus (Monday–Sunday). You can have up to 7 daily
          menus.
        </Typography>
      </Box>

      {dailyMenus.map((workout) => (
        <MenuCard
          key={workout._id}
          workout={workout}
          isExpanded={expandedMenuId === workout._id}
          onToggleExpand={() => {
            setExpandedMenuId(
              expandedMenuId === workout._id ? null : workout._id!,
            );
          }}
          onUpdate={(updated) => handleUpdateWorkout(workout._id!, updated)}
          onDelete={() => handleDeleteWorkout(workout._id!)}
          onDoneForToday={() => handleDoneForToday(workout)}
        />
      ))}

      {/* Add Daily Menu Button */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "background-color 0.2s",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={handleAddMenu}
      >
        <Typography variant="body1" color="text.secondary">
          Add a Daily Menu... ({dailyMenus.length}/7)
        </Typography>
        <AddIcon sx={{ color: "#a34efe" }} />
      </Paper>

      {/* Special Menu Section */}
      <Box sx={{ mt: 5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", mb: 0.5, color: "#000" }}
        >
          Special Menu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Special menus are not counted towards your milestones or weekly
          progress.
        </Typography>

        {specialMenus.map((workout) => (
          <MenuCard
            key={workout._id}
            workout={workout}
            isExpanded={expandedMenuId === workout._id}
            onToggleExpand={() => {
              setExpandedMenuId(
                expandedMenuId === workout._id ? null : workout._id!,
              );
            }}
            onUpdate={(updated) => handleUpdateWorkout(workout._id!, updated)}
            onDelete={() => handleDeleteWorkout(workout._id!)}
            onDoneForToday={() => handleDoneForToday(workout)}
          />
        ))}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mt: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: "action.hover" },
          }}
          onClick={handleAddSpecialMenu}
        >
          <Typography variant="body1" color="text.secondary">
            Add a Special Menu...
          </Typography>
          <AddIcon sx={{ color: "#a34efe" }} />
        </Paper>
      </Box>

      {/* 7-daily-menu limit warning dialog */}
      <Dialog
        open={limitDialogOpen}
        onClose={() => setLimitDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#e0c6fe",
            border: "2px solid #000",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: "#000" }}>
          Daily Menu Limit Reached
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#000" }}>
            You can only create up to 7 daily menus (Monday–Sunday). Use the
            Special Menu section below for additional routines.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLimitDialogOpen(false)}
            sx={{ color: "#000", fontWeight: "bold" }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoutineBuilder;
