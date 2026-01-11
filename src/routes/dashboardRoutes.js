import express from "express";
import {
  getEmployerDashboardOverview,
  getEmployeeDashboardOverview,
} from "../controllers/jobController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Employer dashboard
router.get("/employer/dashboard-overview", authMiddleware, getEmployerDashboardOverview);

// Employee dashboard
router.get("/employee/dashboard-overview", authMiddleware, getEmployeeDashboardOverview);

export default router;
