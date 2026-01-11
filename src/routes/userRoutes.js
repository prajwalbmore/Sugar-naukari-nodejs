import express from "express";
import {
  getUserById,
  getUsers,
  updateEmployeeProfile,
  updateEmployerProfile,
  getApplicantDetails,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import { upload } from "../middleware/uploadMiddleware.js";
// import { getUsers } from "../controllers/userController.js";
// import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.get("/:id", getUserById);
router.get("/applicant/:id", authMiddleware, getApplicantDetails);
// router.post("/", createUser);
router.put(
  "/employee/:id",
  authMiddleware,
  upload.single("resume"),
  updateEmployeeProfile,
);
router.put(
  "/employer/:id",
  authMiddleware,
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "profile_photo", maxCount: 1 },
  ]),
  updateEmployerProfile,
);

export default router;
