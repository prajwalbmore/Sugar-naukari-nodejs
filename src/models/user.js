import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["employee", "employer"],
      required: true,
    },
    fullName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    mobile: { type: String, unique: true, required: true },
    dob: { type: String },
    nationality: { type: String },
    profile_photo: { type: String },
    gender: { type: String },
    file_location: { type: String },

    // EMPLOYER fields (required only for employer role)
    companyName: { type: String },
    companyEmail: { type: String },
    companyWebsite: { type: String },
    companyAddress: { type: String },
    companyLogo: { type: String },
    companyDescription: { type: String },
    industryType: { type: String },
    noOfEmployees: { type: String },
    registrationNumber: { type: String },
    gstNumber: { type: String },

    // EMPLOYEE fields (required only for employee role)
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

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isprofileCreated: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
