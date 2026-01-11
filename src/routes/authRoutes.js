import express from "express";
import { login, refreshUser, register } from "../controllers/authController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refersh", authMiddleware, refreshUser);

export default router;
