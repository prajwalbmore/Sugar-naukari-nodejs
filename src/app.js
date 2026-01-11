import express from "express";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicantRoutes from "./routes/applicantsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import dotenv from "dotenv";
import "./config/db.js";
import connectDB from "./config/db.js";
import cors from "cors";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applicants", applicantRoutes);
app.use("/api/v1", dashboardRoutes);

app.use("/api/v1/uploads", express.static("uploads"));

connectDB();

const PORT = process.env.PORT || 5000; // eslint-disable-line no-undef
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); // eslint-disable-line no-undef
});
