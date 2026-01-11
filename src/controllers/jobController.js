import { Job } from "../models/jobs.js";
import { sendResponse } from "../utils/response.js";

/**
 * Create Job
 */
export const createJob = async (req, res) => {
  try {
    const {
      jobTitle,
      jobDescription,
      jobRole,
      exp_level,
      skills,
      salary,
      vacancy,
      location,
      startdate,
      status,
    } = req.body;

    // if (!jobTitle || !jobDescription || !jobRole || !exp_level || !skills.length || !salary || !vacancy || !location || !startdate) {
    //   return sendResponse(res, false, "All required fields must be provided.");
    // }

    const job = await Job.create({
      jobTitle,
      jobDescription,
      jobRole,
      exp_level,
      skills,
      salary,
      vacancy,
      location,
      startdate,
      status,
      createdBy: req.user?.id || null, // optional auth user
    });

    return sendResponse(res, true, "Job created successfully.", job);
  } catch (error) {
    console.error("Error creating job:", error);
    return sendResponse(res, false, error.message || "Error creating job.");
  }
};

/**
 * Get All Jobs
 */
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });

    return sendResponse(res, true, "Jobs fetched successfully.", jobs);
  } catch (error) {
    return sendResponse(res, false, error.message || "Error fetching jobs.");
  }
};
export const getAllJobsForDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Get jobs with populated employer data
    const jobs = await Job.find()
      .populate("createdBy", "fullName companyName companyLogo role")
      .sort({ createdAt: -1 });

    // If user is authenticated, add application status to each job
    if (userId && req.user?.role === "employee") {
      const { Applicant } = await import("../models/applicants.js");

      const jobsWithStatus = await Promise.all(
        jobs.map(async (job) => {
          const application = await Applicant.findOne({
            jobId: job._id,
            userId: userId,
          });

          return {
            ...job.toObject(),
            hasApplied: !!application,
            applicationStatus: application?.status || null,
          };
        }),
      );

      return sendResponse(
        res,
        true,
        "Jobs fetched successfully.",
        jobsWithStatus,
      );
    }

    return sendResponse(res, true, "Jobs fetched successfully.", jobs);
  } catch (error) {
    return sendResponse(res, false, error.message || "Error fetching jobs.");
  }
};

/**
 * Get Single Job
 */
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);
    if (!job) return sendResponse(res, false, "Job not found.");
    return sendResponse(res, true, "Job fetched successfully.", job);
  } catch (error) {
    return sendResponse(res, false, error.message || "Error fetching job.");
  }
};

/**
 * Update Job
 */
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return sendResponse(res, false, "Job ID is required.");

    const updates = {};
    const allowedFields = [
      "jobTitle",
      "jobDescription",
      "jobRole",
      "exp_level",
      "skills",
      "salary",
      "vacancy",
      "location",
      "startdate",
      "enddate",
      "status",
    ];

    // Add only fields that exist in req.body
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Find job first
    const job = await Job.findById(id);
    if (!job) return sendResponse(res, false, "Job not found.");

    // Update fields manually
    Object.assign(job, updates);

    // Save updated job
    await job.save();

    return sendResponse(res, true, "Job updated successfully.", job);
  } catch (error) {
    return sendResponse(res, false, error.message || "Error updating job.");
  }
};

/**
 * Change Job Status
 */
export const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "closed", "draft"].includes(status)) {
      return sendResponse(res, false, "Invalid status provided.");
    }

    const job = await Job.findByIdAndUpdate(id, { status }, { new: true });
    if (!job) return sendResponse(res, false, "Job not found.");

    return sendResponse(res, true, `Job status updated to ${status}.`, job);
  } catch (error) {
    return sendResponse(res, false, error.message || "Error updating status.");
  }
};

/**
 * Complete Job
 */
export const completeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { enddate } = req.body;

    const job = await Job.findById(id);
    if (!job) return sendResponse(res, false, "Job not found.");

    // Update job with end date and completed status
    job.enddate = enddate || new Date();
    job.status = "completed";
    await job.save();

    return sendResponse(res, true, "Job completed successfully.", job);
  } catch (error) {
    return sendResponse(res, false, error.message || "Error completing job.");
  }
};

/**
 * Delete Job
 */
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByIdAndDelete(id);
    if (!job) return sendResponse(res, false, "Job not found.");
    return sendResponse(res, true, "Job deleted successfully.", job);
  } catch (error) {
    return sendResponse(res, false, error.message || "Error deleting job.");
  }
};

export const getEmployerJobListing = async (req, res) => {
  try {
    const { status } = req.params; // e.g. active, draft, closed, etc.

    const filter = status && status !== "all" ? { status } : {};

    const jobs = await Job.find(filter).populate("createdBy");

    const formattedJobs = jobs.map((job) => ({
      job_id: job._id,
      job_role: job.jobRole,
      status:
        job.status === "closed"
          ? "inactive"
          : job.status === "draft"
            ? "save-as-draft"
            : "active",
      posted_on: job.createdAt.toISOString().split("T")[0],
      start_date: job.startdate.toISOString().split("T")[0],
      no_of_applications: 0, // you can replace this with actual applicant count if you track it
      total_vacancy: job.vacancy,
      is_close_possible: job.status === "active",
      raw: job, // simple logic, adjust as needed
    }));

    res.json({
      success: true,
      message: "Jobs fetched successfully",
      data: formattedJobs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error fetching jobs",
    });
  }
};
