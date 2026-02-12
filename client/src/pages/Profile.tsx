import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import {
  fetchUserProfile,
  updateUserProfile,
  fetchBadges,
  type UserProfile,
  type Badge,
} from "../services/userService";

const Profile = () => {
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);

  // Local state for inputs
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    purpose: "",
    threeMonthGoal: "",
    weeklyGoal: "",
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [goalToLock, setGoalToLock] = useState<"weekly" | "threeMonth" | null>(
    null,
  );
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const badgeCountRef = useRef(0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const [userData, badgesData] = await Promise.all([
          fetchUserProfile(),
          fetchBadges(),
        ]);

        // Check for new badges
        if (
          badgeCountRef.current > 0 &&
          userData.badges.length > badgeCountRef.current
        ) {
          const newlyEarnedBadgeName =
            userData.badges[userData.badges.length - 1];
          const badgeInfo = badgesData.find(
            (b) => b.name === newlyEarnedBadgeName,
          );
          if (badgeInfo) {
            setNewBadge(badgeInfo);
          }
        }
        badgeCountRef.current = userData.badges.length;

        // Reset goals if time has passed
        if (userData.weeklyGoalLockIn) {
          const lockInDate = new Date(userData.weeklyGoalLockIn);
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          if (new Date().getTime() - lockInDate.getTime() > oneWeek) {
            userData.weeklyGoalLockIn = null;
          }
        }
        if (userData.threeMonthGoalLockIn) {
          const lockInDate = new Date(userData.threeMonthGoalLockIn);
          const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;
          if (new Date().getTime() - lockInDate.getTime() > threeMonths) {
            userData.threeMonthGoalLockIn = null;
          }
        }

        setUser(userData);
        setAvailableBadges(badgesData);

        // Snackbar: 7-day consistency milestone
        const streakLen = userData.streakDates?.length ?? 0;
        const cycleKey = `snackbar_7day_${userData.commitmentStartDate ?? "default"}`;
        if (streakLen >= 7 && !localStorage.getItem(cycleKey)) {
          localStorage.setItem(cycleKey, "true");
          setSnackbarMsg(
            "Amazing! You've hit 7 days of consistent commitment! Keep the momentum going!",
          );
          setSnackbarOpen(true);
        }
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          purpose: userData.purpose || "",
          threeMonthGoal: userData.threeMonthGoal || "",
          weeklyGoal: userData.weeklyGoal || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLockInClick = (goalType: "weekly" | "threeMonth") => {
    setGoalToLock(goalType);
    setOpen(true);
  };

  const handleConfirmLockIn = async () => {
    if (!goalToLock) return;

    const field =
      goalToLock === "weekly" ? "weeklyGoalLockIn" : "threeMonthGoalLockIn";
    try {
      const updated = await updateUserProfile({ [field]: new Date() });
      setUser(updated);
    } catch (err) {
      console.error("Failed to lock in goal", err);
    }
    setOpen(false);
    setGoalToLock(null);
  };

  const handleClose = () => {
    setOpen(false);
    setGoalToLock(null);
  };

  const handleBlur = async (field: keyof typeof formData) => {
    if (!user) return;
    if (formData[field] !== user[field]) {
      try {
        const updated = await updateUserProfile({ [field]: formData[field] });
        setUser(updated);
      } catch (err) {
        console.error("Failed to update profile field", field, err);
      }
    }
  };

  const handleNameSave = async () => {
    if (formData.firstName.trim()) {
      handleBlur("firstName");
    } else {
      setFormData((prev) => ({ ...prev, firstName: user?.firstName || "" }));
    }
    setIsEditingName(false);
  };

  const handleGoalStatusChange = async (
    field: "weeklyGoalStatus" | "threeMonthGoalStatus",
    newStatus: string,
  ) => {
    if (!user) return;
    try {
      const updated = await updateUserProfile({ [field]: newStatus });
      setUser(updated);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size whether < 2MB for base64 storage
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const updated = await updateUserProfile({ profileImage: base64String });
        setUser(updated);
      } catch (err) {
        console.error("Failed to upload image", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const getBadgeIcon = (badge: Badge) => {
    // Determine color based on tier
    let color = "#cd8532"; // default blue-ish
    if (badge.tier === "bronze") color = "#cd8532";
    if (badge.tier === "silver") color = "#c0c0c0";
    if (badge.tier === "gold") color = "#eed12b";

    const IconWrapper = ({ children }: { children: React.ReactNode }) => (
      <Box sx={{ color, fontSize: 40, display: "flex" }}>{children}</Box>
    );

    switch (badge.icon) {
      case "FitnessCenter":
        return (
          <IconWrapper>
            <FitnessCenterIcon fontSize="inherit" />
          </IconWrapper>
        );
      case "DirectionsRun":
        return (
          <IconWrapper>
            <DirectionsRunIcon fontSize="inherit" />
          </IconWrapper>
        );
      case "DirectionsBike":
        return (
          <IconWrapper>
            <DirectionsBikeIcon fontSize="inherit" />
          </IconWrapper>
        );
      case "SelfImprovement":
        return (
          <IconWrapper>
            <SelfImprovementIcon fontSize="inherit" />
          </IconWrapper>
        );
      default:
        return (
          <IconWrapper>
            <EmojiEventsIcon fontSize="inherit" />
          </IconWrapper>
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: "#a34efe" }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">Failed to load profile.</Typography>
      </Box>
    );
  }

  // --- Styles ---
  const darkInputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: "#000000",
      color: "#ffffff",
      borderRadius: 2,
      mt: 0,
      "& fieldset": { border: "none" },
    },
    "& .MuiInputBase-input": {
      color: "#ffffff",
      p: 1,
      fontSize: "0.9rem",
    },
    "& .MuiInputBase-input::placeholder": {
      color: "#aaaaaa",
      opacity: 1,
    },
  };

  const labelSx = {
    fontWeight: "bold",
    fontSize: "1.1rem",
    mb: 0.5,
    display: "block",
    color: "#000",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "#ffffff";
      case "in_progress":
        return "#fff9c4";
      case "completed":
        return "#c2e4ff";
      default:
        return "#ffffff";
    }
  };

  return (
    <Box sx={{ pb: 4, width: "100%", maxWidth: "md", mx: "auto" }}>
      {/* Header */}
      <Typography
        variant="h6"
        sx={{ textAlign: "center", color: "grey", fontWeight: "bold" }}
      >
        Healthify
      </Typography>
      <Typography
        variant="h4"
        align="center"
        sx={{ color: "#000", fontWeight: "bold", fontStyle: "italic", mb: 2 }}
      >
        {user?.firstName ? `${user.firstName}'s` : ""} Profile
      </Typography>

      {/* Main Card */}
      <Paper
        elevation={3}
        sx={{
          bgcolor: "#e0c6fe",
          borderRadius: 4,
          p: { xs: 2, md: 4 },
          mx: { xs: 2, md: 0 },
          width: "100%",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Logout Button */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "#000",
            backgroundColor: "#a34efe",
            borderColor: "rgba(0, 0, 0, 0.78)",
            fontSize: "0.9rem",
            textTransform: "none",
            zIndex: 1,
          }}
        >
          Logout
        </Button>

        {/* Header: Avatar + Fields */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={user.profileImage}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "#ffffff",
                  color: "#000",
                  border: "2px solid #000",
                  fontSize: "2rem",
                }}
              >
                {!user.profileImage && user.username.charAt(0).toUpperCase()}
              </Avatar>
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: "absolute",
                  bottom: -5,
                  right: -5,
                  bgcolor: "#a34efe",
                  color: "#fff",
                  p: 0.5,
                  "&:hover": { bgcolor: "#8e3edb" },
                  boxShadow: 2,
                }}
                size="small"
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Box>
          </Box>

          {/* Name & Purpose */}
          <Box
            sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}
          >
            <Box>
              {isEditingName ? (
                <TextField
                  variant="outlined"
                  fullWidth
                  autoFocus
                  size="small"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") {
                      setFormData((prev) => ({
                        ...prev,
                        firstName: user.firstName,
                      }));
                      setIsEditingName(false);
                    }
                  }}
                  sx={darkInputSx}
                />
              ) : (
                <Box
                  onClick={() => setIsEditingName(true)}
                  sx={{
                    color: "#000",
                    p: 0,
                    borderRadius: 2,
                    cursor: "text",
                    minHeight: "40px",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    "&:hover": { opacity: 0.7 },
                  }}
                >
                  <Typography variant="h5" component="div">
                    {formData.firstName || "Click to set name"}
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              placeholder="Purpose of workout"
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              onBlur={() => handleBlur("purpose")}
              sx={{ ...darkInputSx, mt: 0.5 }}
            />
          </Box>
        </Box>

        {/* Badges System */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={labelSx}>Badges</Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              pb: 1,
              borderBottom: "2px solid #474747",
              minHeight: 50,
            }}
          >
            {/* Render badges the user has */}
            {user.badges.map((badgeName, idx) => {
              const badgeDef = availableBadges.find(
                (b) => b.name === badgeName,
              );
              if (!badgeDef) return null;
              return (
                <Tooltip key={idx} title={badgeDef.description || badgeName}>
                  <Box>{getBadgeIcon(badgeDef)}</Box>
                </Tooltip>
              );
            })}

            {user.badges.length === 0 && (
              <Typography
                variant="body2"
                color="rgba(0,0,0,0.5)"
                sx={{ fontStyle: "italic", alignSelf: "center" }}
              >
                No badges yet. Keep training to earn them!
              </Typography>
            )}
          </Box>
        </Box>

        {/* Goals Section */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography sx={{ ...labelSx, mb: 0 }}>Weekly Goal</Typography>
            <Select
              size="small"
              value={
                ["not_started", "in_progress", "completed"].includes(
                  user.weeklyGoalStatus,
                )
                  ? user.weeklyGoalStatus
                  : "not_started"
              }
              onChange={(e) =>
                handleGoalStatusChange("weeklyGoalStatus", e.target.value)
              }
              sx={{
                bgcolor: getStatusColor(user.weeklyGoalStatus || "not_started"),
                height: 32,
                fontSize: "0.875rem",
              }}
            >
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </Box>
          <TextField
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            placeholder="Enter description..."
            value={formData.weeklyGoal}
            onChange={(e) =>
              setFormData({ ...formData, weeklyGoal: e.target.value })
            }
            onBlur={() => handleBlur("weeklyGoal")}
            sx={{ ...darkInputSx, mt: 0.5 }}
            disabled={!!user.weeklyGoalLockIn}
          />
          {user.weeklyGoalLockIn ? (
            <Button fullWidth variant="contained" disabled sx={{ mt: 1 }}>
              Locked in on{" "}
              {new Date(user.weeklyGoalLockIn).toLocaleDateString()}
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleLockInClick("weekly")}
              sx={{
                mt: 1,
                bgcolor: "#a34efe",
                "&:hover": { bgcolor: "#e0c6fe" },
              }}
            >
              Lock in, and start
            </Button>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography sx={{ ...labelSx, mb: 0 }}>3-months Goal</Typography>
            <Select
              size="small"
              value={
                ["not_started", "in_progress", "completed"].includes(
                  user.threeMonthGoalStatus,
                )
                  ? user.threeMonthGoalStatus
                  : "not_started"
              }
              onChange={(e) =>
                handleGoalStatusChange("threeMonthGoalStatus", e.target.value)
              }
              sx={{
                bgcolor: getStatusColor(
                  user.threeMonthGoalStatus || "not_started",
                ),
                height: 32,
                fontSize: "0.875rem",
              }}
            >
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </Box>
          <TextField
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            placeholder="Enter description..."
            value={formData.threeMonthGoal}
            onChange={(e) =>
              setFormData({ ...formData, threeMonthGoal: e.target.value })
            }
            onBlur={() => handleBlur("threeMonthGoal")}
            sx={{ ...darkInputSx, mt: 0.5 }}
            disabled={!!user.threeMonthGoalLockIn}
          />
          {user.threeMonthGoalLockIn ? (
            <Button fullWidth variant="contained" disabled sx={{ mt: 1 }}>
              Locked in on{" "}
              {new Date(user.threeMonthGoalLockIn).toLocaleDateString()}
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleLockInClick("threeMonth")}
              sx={{
                mt: 1,
                bgcolor: "#a34efe",
                "&:hover": { bgcolor: "#e0c6fe" },
              }}
            >
              Lock in, and start
            </Button>
          )}
        </Box>

        {/* Commitment Challenge Auto-Sync with user.currentStreak */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={labelSx}>20 days Commitment Challenge</Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(44px, 1fr))",
              gap: 1.5,
              mt: 1,
              width: "100%",
            }}
          >
            {Array.from({ length: 20 }).map((_, index) => {
              // Default start: 7 days before today unless user has a commitment start
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const defaultStart = new Date(today);
              defaultStart.setDate(defaultStart.getDate() - 7);
              const startDate = user.commitmentStartDate
                ? new Date(user.commitmentStartDate)
                : defaultStart;
              const dateForCircle = new Date(startDate);
              dateForCircle.setDate(startDate.getDate() + index);

              const dayNumber = dateForCircle.getDate();

              const dateStr = dateForCircle.toDateString();
              const isRecorded = user.streakDates?.some(
                (d: string) => new Date(d).toDateString() === dateStr,
              );

              const isFuture = dateForCircle.getTime() > today.getTime();
              const isToday = dateForCircle.getTime() === today.getTime();
              // Default border: light grey for future, white for past/now
              let borderColor = isFuture ? "#474747" : "#a34efe";
              // If the day is recorded, use purple outline
              if (isRecorded) borderColor = "#a34efe";
              // Today's recorded day is highlighted
              if (isToday && isRecorded) borderColor = "#a34efe";

              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: `2px solid ${borderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isRecorded ? (
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            bgcolor: "#a34efe",
                          }}
                        />
                      ) : !isFuture ? (
                        <CloseIcon sx={{ color: "#a34efe", fontSize: 18 }} />
                      ) : (
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            bgcolor: "transparent",
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#000", fontWeight: "bold" }}
                  >
                    {dayNumber}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { bgcolor: "#a34efe", border: "2px solid #000", borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>Confirm Goal Lock-in</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#fff" }}>
            Are you sure you want to lock in this goal? You won't be able to
            edit it after locking it in.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: "#fff" }}>
            Keep Editing
          </Button>
          <Button
            onClick={handleConfirmLockIn}
            autoFocus
            sx={{ color: "#fff" }}
          >
            Lock In
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: { bgcolor: "#000", border: "2px solid #a34efe", borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#fff" }}>
            Have you marked your menu as complete? This will update your record.
            Make sure to do so before logging out!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: "#fff" }}
          >
            Cancel
          </Button>
          <Button onClick={handleLogout} autoFocus sx={{ color: "#fff" }}>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      {newBadge && (
        <Dialog
          open={!!newBadge}
          onClose={() => setNewBadge(null)}
          PaperProps={{
            sx: {
              bgcolor: "#a34efe",
              border: "2px solid #000",
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ color: "#fff" }}>New Badge Earned!</DialogTitle>
          <IconButton
            aria-label="close"
            onClick={() => setNewBadge(null)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "#fff",
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ color: "#fff" }}>
              {newBadge.name}
            </Typography>
            <Box sx={{ my: 2 }}>{getBadgeIcon(newBadge)}</Box>
            <DialogContentText sx={{ color: "#fff" }}>
              {newBadge.description}
            </DialogContentText>
          </DialogContent>
        </Dialog>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%", bgcolor: "#a34efe", color: "#fff" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
