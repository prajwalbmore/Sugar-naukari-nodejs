import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

export const updateEmployeeProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      education,
      skills,
      languages,
      about,
      currentPosition,
      expectedSalary,
      preferredLocation,
    } = req.body;
    console.log(req.body);
    // Step 1: Verify user exists and is an employee
    const user = await User.findById(userId);
    if (!user || user.role !== "employee") {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });
    }
    const resume = req.file.filename || user.resume;

    // Step 2: Update only provided fields
    if (education !== undefined) user.education = education;
    if (skills !== undefined) user.skills = skills;
    if (languages !== undefined) user.languages = languages;
    if (resume !== undefined) user.resume = resume;
    if (about !== undefined) user.about = about;
    if (currentPosition !== undefined) user.currentPosition = currentPosition;
    if (expectedSalary !== undefined) user.expectedSalary = expectedSalary;
    if (preferredLocation !== undefined)
      user.preferredLocation = preferredLocation;

    // Step 3: Save changes
    const updatedEmployee = await user.save();

    return res.json({
      success: true,
      message: "Employee profile updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

export const updateEmployerProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Extract all text fields
    const {
      fullName,
      email,
      mobile,
      companyName,
      companyEmail,
      companyWebsite,
      companyAddress,
      companyDescription,
      industryType,
      noOfEmployees,
      registrationNumber,
      gstNumber,
    } = req.body;

    // Step 1: Verify user exists and is an employer
    const user = await User.findById(userId);
    if (!user || user.role !== "employer") {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
        data: null,
      });
    }
    if (user.isprofileCreated === false) {
      user.isprofileCreated = true;
    }
    // Step 2: Extract uploaded files (upload.fields)
    let companyLogo = user.companyLogo;
    let profile_photo = user.profile_photo;

    if (req.files && req.files.companyLogo && req.files.companyLogo[0]) {
      companyLogo = req.files.companyLogo[0].filename;
    }
    if (req.files && req.files.profile_photo && req.files.profile_photo[0]) {
      profile_photo = req.files.profile_photo[0].filename;
      profile_photo = req.files.profile_photo[0].filename;
    }

    // Step 3: Update PERSONAL FIELDS
    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (mobile !== undefined) user.mobile = mobile;

    // Step 4: Update COMPANY FIELDS
    if (companyName !== undefined) user.companyName = companyName;
    if (companyEmail !== undefined) user.companyEmail = companyEmail;
    if (companyWebsite !== undefined) user.companyWebsite = companyWebsite;
    if (companyAddress !== undefined) user.companyAddress = companyAddress;
    if (companyDescription !== undefined)
      user.companyDescription = companyDescription;
    if (industryType !== undefined) user.industryType = industryType;
    if (noOfEmployees !== undefined) user.noOfEmployees = noOfEmployees;
    if (registrationNumber !== undefined)
      user.registrationNumber = registrationNumber;
    if (gstNumber !== undefined) user.gstNumber = gstNumber;

    // Step 5: File field update
    if (companyLogo !== undefined) user.companyLogo = companyLogo;
    if (profile_photo !== undefined) user.profile_photo = profile_photo;

    // Step 6: Save changes
    await user.save();

    return res.json({
      success: true,
      message: "Employer profile updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

/**
 * Fetch all users
 */
export const getUsers = async (req, res) => {
  try {
    // Example fetch logic from database
    const users = await User.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get details of a single user
 */
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Update user details
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Hash the password if provided
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : user.password;

    // Update user
    await user.update({ name, email, password: hashedPassword });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.destroy();
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get Applicant Details for Employer View
 */
export const getApplicantDetails = async (req, res) => {
  try {
    const { id: emp_id } = req.params;
    const { job_id } = req.query;

    // Find the user/applicant
    const user = await User.findById(emp_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }

    // Find the application for this job if job_id is provided
    let application = null;
    let application_status = null;

    if (job_id) {
      const { Applicant } = await import("../models/applicants.js");
      application = await Applicant.findOne({
        userId: emp_id,
        jobId: job_id,
      });
      application_status = application?.status || null;
    }

    // Format user data for employer view
    const applicantData = {
      emp_id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      profile_photo: user.profile_photo,
      nationality: user.nationality,
      gender: user.gender,
      dob: user.dob,
      application_status: application_status,
      employee_reviews: 4.5, // Placeholder for employee reviews

      // Employee-specific data
      education: user.education || [],
      experience: user.experience || [],
      skills: user.skills || [],
      languages: user.languages || [],
      resume: user.resume,
      about: user.about,
      currentPosition: user.currentPosition,
      expectedSalary: user.expectedSalary,
      preferredLocation: user.preferredLocation,

      // Job match data (placeholder)
      job_match: {
        match_percentage: 75,
        employee_have: 6,
        total_required: 8,
        matched_skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
        unmatched_skills: ["Python", "AWS"],
      },
    };

    res.json({
      success: true,
      message: "Applicant details fetched successfully",
      data: applicantData,
    });
  } catch (error) {
    console.error("Error fetching applicant details:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching applicant details",
    });
  }
};
