import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "approved", "reject", "ongoing", "hired", "completed"],
      default: "applied",
    },
  },
  { timestamps: true },
);

export const Applicant = mongoose.model("Applicant", applicantSchema);
