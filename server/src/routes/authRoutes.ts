import { Router } from "express";
import { body, validationResult } from "express-validator";
import {
  register,
  login,
  getProfile,
  updateProfile,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Middleware to handle validation errors from express-validator
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("confirmEmail").custom((value, { req }) => {
      if (value !== req.body.email) {
        throw new Error("Emails do not match");
      }
      return true;
    }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  validate,
  register,
);

router.post("/login", login);

router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);

export default router;
