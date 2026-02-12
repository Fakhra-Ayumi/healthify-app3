import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (_event: React.SyntheticEvent, value: string) => {
    navigate(value);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        padding: 1,
        zIndex: 1200,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
        bgcolor: "#000000",
      }}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={handleChange}
        showLabels
        sx={{
          bgcolor: "#000000",
          "& .MuiBottomNavigationAction-root": {
            color: "#ffffff",
            "& .MuiSvgIcon-root": {
              color: "#ffffff",
            },
            "&:focus": {
              outline: "none",
            },
            "&.Mui-focusVisible": {
              outline: "none",
            },
          },
          "& .Mui-selected": {
            "&.MuiBottomNavigationAction-root": {
              color: "#a34efe",
            },
            "& .MuiSvgIcon-root": {
              color: "#a34efe",
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Milestones"
          value="/app/milestones"
          icon={<TimelineIcon />}
        />
        <BottomNavigationAction
          label="Routine"
          value="/app"
          icon={<FitnessCenterIcon />}
        />
        <BottomNavigationAction
          label="Profile"
          value="/app/profile"
          icon={<AccountCircleIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
