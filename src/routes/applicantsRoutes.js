import express from "express";
import {
  createApplicant,
  deleteApplicant,
  getAllApplicants,
  getApplicantsByJob,
  updateApplicantStatus,
  completeJobApplications,
  calculateAndAddExperience,
  getMyApplications,
  getApplicantsForEmployer,
} from "../controllers/applicantController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ✅ POST - Apply for a Job
router.post("/", authMiddleware, createApplicant);

// ✅ GET - All Applicants
router.get("/", getAllApplicants);

// ✅ GET - My Applications (Employee)
router.get("/my-applications", authMiddleware, getMyApplications);

// ✅ GET - All Applicants for Employer (for all their jobs)
router.get("/employer", authMiddleware, getApplicantsForEmployer);

// ✅ GET - Applicants for Specific Job
router.get("/job/:jobId", getApplicantsByJob);

// ✅ PUT - Update Applicant Status
router.put("/:id/status", updateApplicantStatus);

// ✅ PUT - Complete All Applications for a Job
router.put("/job/:jobId/complete", authMiddleware, completeJobApplications);

// ✅ POST - Calculate and Add Experience for Completed Job
router.post(
  "/experience/:jobId/:userId",
  authMiddleware,
  calculateAndAddExperience,
);

// ✅ DELETE - Remove Applicant
router.delete("/:id", deleteApplicant);

export default router;
