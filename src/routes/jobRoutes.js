import express from "express";
import {
  createJob,
  getAllJobs,
  getAllJobsForDashboard,
  getEmployerJobListing,
  getJobById,
  updateJob,
  completeJob,
} from "../controllers/jobController.js";
import authMiddleware from "../middleware/auth.js";
const router = express.Router();

router.post("/", authMiddleware, createJob);
router.get("/", getAllJobs);
router.get("/dashboard/employee", authMiddleware, getAllJobsForDashboard);
router.get("/employer/", authMiddleware, getEmployerJobListing);
router.get("/:id", authMiddleware, getJobById);
router.put("/:id", authMiddleware, updateJob);
router.put("/:id/complete", authMiddleware, completeJob);

export default router;
