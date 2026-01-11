import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    jobRole: { type: String, required: true },
    exp_level: { type: String, required: true },
    skills: [{ type: String, required: false }],
    salary: { type: String, required: true },
    vacancy: { type: Number, required: true },
    location: { type: String, required: true },
    startdate: { type: Date, required: true },
    enddate: { type: Date }, // Optional end date for job completion

    // 🔹 Status of the job
    status: {
      type: String,
      enum: ["active", "closed", "draft", "completed"],
      default: "active",
    },

    // 🔹 Optional: if job belongs to employer
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Job = mongoose.model("Job", jobSchema);
