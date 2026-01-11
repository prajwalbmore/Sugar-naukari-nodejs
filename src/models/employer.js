import mongoose from "mongoose";
import { User } from "./user.js";

const employerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyEmail: { type: String },
  companyWebsite: { type: String },
  companyAddress: { type: String },
  companyLogo: { type: String },
  companyDescription: { type: String },
  industryType: { type: String },
  noOfEmployees: { type: Number },
  registrationNumber: { type: String },
  gstNumber: { type: String },
});

export const Employer = User.discriminator("employer", employerSchema);
