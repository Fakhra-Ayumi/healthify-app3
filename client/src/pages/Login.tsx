import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Link,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  /* Processes the login attempt. On success, stores the JWT in localStorage for persistent sessions. */
  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        credentials,
      );
      const { token, user } = response.data;

      /* Store the JWT in localStorage to keep the user logged in across refreshes. */
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert(`Welcome back, ${user.username}!`);
      navigate("/app");
    } catch (err) {
      /* Error handling: manage the unknown catch value safely. */
      let message = "Login failed. Please check your credentials.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message || message;
      }
      alert(message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          mt: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: "100%",
            bgcolor: "background.paper",
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h4"
            align="center"
            color="textPrimary"
            sx={{ mb: 1, fontWeight: "bold" }}
          >
            Healthify
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="textSecondary"
            sx={{ mb: 4 }}
          >
            Log in to continue your streak!
          </Typography>

          <form onSubmit={handleLogin}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  variant="filled"
                  onChange={handleChange}
                  required
                  sx={{
                    "& .MuiFilledInput-root": {
                      backgroundColor: "#000",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#111",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "#000",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#ccc",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#fff",
                    },
                    "& .MuiFilledInput-underline:before": {
                      borderBottomColor: "#000",
                    },
                    "& .MuiFilledInput-underline:after": {
                      borderBottomColor: "#ccc",
                    },
                  }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  variant="filled"
                  onChange={handleChange}
                  required
                  sx={{
                    "& .MuiFilledInput-root": {
                      backgroundColor: "#000",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#111",
                      },
                      "&.Mui-focused": {
                        backgroundColor: "#000",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#ccc",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#fff",
                    },
                    "& .MuiFilledInput-underline:before": {
                      borderBottomColor: "#000",
                    },
                    "& .MuiFilledInput-underline:after": {
                      borderBottomColor: "#ccc",
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 4,
                py: 1.5,
                borderRadius: 8,
                bgcolor: "#a34efe",
                color: "#000000",
                fontWeight: "bold",
                boxShadow: "none",
                "&:hover": { bgcolor: "#e0c6fe" },
              }}
            >
              Log In
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2">
              Don't have an account?{" "}
              <Link
                href="/signup"
                sx={{
                  fontWeight: "bold",
                  textDecoration: "none",
                  color: "#a34efe",
                }}
              >
                Join Healthify
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
