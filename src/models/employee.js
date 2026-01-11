import mongoose from "mongoose";
import { User } from "./user.js";

const employeeSchema = new mongoose.Schema({
  education: [
    {
      degree: { type: String },
      institution: { type: String },
      yearOfPassing: { type: String },
    },
  ],
  experience: [
    {
      company: { type: String },
      role: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
    },
  ],
  skills: [{ type: String }],
  languages: [{ type: String }],
  resume: { type: String },
  about: { type: String },
  currentPosition: { type: String },
  expectedSalary: { type: Number },
  preferredLocation: { type: String },
});

export const Employee = User.discriminator("employee", employeeSchema);
