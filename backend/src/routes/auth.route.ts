import express from "express";
import {
  getMe,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { Protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", Protect, getMe);

export default router;
