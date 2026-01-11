import { Applicant } from "../models/applicants.js";
import { Job } from "../models/jobs.js";

// ✅ Create Applicant
export const createApplicant = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "jobId is required",
        data: null,
      });
    }

    // 1️⃣ Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
        data: null,
      });
    }

    // 2️⃣ Check if user already applied
    const existingApplication = await Applicant.findOne({
      jobId,
      userId: req.user.id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You already applied for this job",
        data: existingApplication,
      });
    }

    // 3️⃣ Create application
    const applicant = await Applicant.create({
      jobId,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: applicant,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error submitting application",
      data: null,
    });
  }
};

// ✅ Get All Applicants (Admin/Employer)
export const getAllApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.find()
      .populate("jobId", "jobRole location")
      .populate("userId", "name email");

    res.json({
      success: true,
      message: "Applicants fetched successfully",
      data: applicants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching applicants",
    });
  }
};

// ✅ Get Applicants for Specific Job
export const getApplicantsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applicants = await Applicant.find({ jobId }).populate(
      "userId",
      "name email",
    );

    res.json({
      success: true,
      message: "Applicants fetched successfully",
      data: applicants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching applicants for job",
    });
  }
};

// ✅ Update Applicant Status (e.g., shortlisted, hired)
export const updateApplicantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const applicant = await Applicant.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!applicant) {
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    }

    res.json({
      success: true,
      message: "Applicant status updated successfully",
      data: applicant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating applicant status",
    });
  }
};

// ✅ Complete Applications for a Job
export const completeJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Update all hired applicants for this job to completed status
    const result = await Applicant.updateMany(
      { jobId, status: "hired" },
      { status: "completed" },
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} applications marked as completed`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error completing applications",
    });
  }
};

// ✅ Calculate and Add Experience for Completed Job
export const calculateAndAddExperience = async (req, res) => {
  try {
    const { jobId, userId } = req.params;

    // Find the completed application
    const application = await Applicant.findOne({
      jobId,
      userId,
      status: "completed",
    })
      .populate("jobId")
      .populate("userId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Completed application not found",
      });
    }

    const job = application.jobId;
    const user = application.userId;

    // Experience duration is calculated from start and end dates

    // Create experience entry
    const experienceEntry = {
      company: job.createdBy.companyName || "Company",
      role: job.jobRole,
      startDate: job.startdate,
      endDate: job.enddate,
      description: `Worked as ${job.jobRole} from ${job.startdate.toDateString()} to ${job.enddate.toDateString()}`,
    };

    // Add to user's experience array if not already present
    const existingExperience = user.experience.find(
      (exp) =>
        exp.company === experienceEntry.company &&
        exp.role === experienceEntry.role &&
        exp.startDate.getTime() === experienceEntry.startDate.getTime(),
    );

    if (!existingExperience) {
      user.experience.push(experienceEntry);
      await user.save();
    }

    res.json({
      success: true,
      message: "Experience added successfully",
      data: experienceEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error calculating experience",
    });
  }
};

// ✅ Get All Applicants for Employer (shows applicants for all jobs posted by the employer)
export const getApplicantsForEmployer = async (req, res) => {
  try {
    const employerId = req.user?.id;

    if (!employerId) {
      return res.status(401).json({
        success: false,
        message: "Employer not authenticated",
      });
    }

    // First, get all jobs posted by this employer
    const { Job } = await import('../models/jobs.js');
    const employerJobs = await Job.find({ createdBy: employerId }).select('_id jobTitle jobRole');
    const jobIds = employerJobs.map(job => job._id);

    if (jobIds.length === 0) {
      return res.json({
        success: true,
        message: "No jobs posted yet",
        data: [],
      });
    }

    // Get all applicants for these jobs
    const applications = await Applicant.find({ jobId: { $in: jobIds } })
      .populate({
        path: 'jobId',
        select: 'jobTitle jobRole',
      })
      .populate({
        path: 'userId',
        select: 'fullName profile_photo email mobile',
      })
      .sort({ createdAt: -1 });

    // Format the applications data for employer view
    const formattedApplications = applications.map(app => ({
      application_id: app._id,
      employee_id: app.userId?._id,
      employee_name: app.userId?.fullName || 'Unknown',
      profile_image: app.userId?.profile_photo || null,
      email: app.userId?.email || '',
      mobile: app.userId?.mobile || '',
      job_id: app.jobId?._id,
      job_title: app.jobId?.jobTitle || 'Job Title',
      applied_on: app.createdAt.toISOString().split('T')[0],
      status: app.status,
      skill_match: 75, // Placeholder - you can calculate this based on skills matching
      review_rating: 4, // Placeholder - you can get this from reviews
      job_match: {
        match_percentage: 75,
        employee_have: 6,
        total_required: 8,
        matched_skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
        unmatched_skills: ["Python", "AWS"]
      }
    }));

    res.json({
      success: true,
      message: "Applicants fetched successfully",
      data: formattedApplications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching applicants",
    });
  }
};

// ✅ Get My Applications (Employee)
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get all applications for the current user
    const applications = await Applicant.find({ userId })
      .populate({
        path: 'jobId',
        select: 'jobTitle jobRole companyName createdBy',
        populate: {
          path: 'createdBy',
          select: 'fullName companyName'
        }
      })
      .sort({ createdAt: -1 });

    // Format the applications data
    const formattedApplications = applications.map(app => ({
      id: app._id,
      job_id: app.jobId?._id,
      job_title: app.jobId?.jobTitle || 'Job Title',
      role: app.jobId?.jobRole || 'Role',
      company_name: app.jobId?.createdBy?.companyName || app.jobId?.createdBy?.fullName || 'Company',
      date_applied: app.createdAt.toISOString().split('T')[0],
      status: app.status,
      application_id: app._id
    }));

    res.json({
      success: true,
      message: "Applications fetched successfully",
      data: formattedApplications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching applications",
    });
  }
};

// ✅ Delete Applicant
export const deleteApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const applicant = await Applicant.findByIdAndDelete(id);

    if (!applicant) {
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    }

    res.json({
      success: true,
      message: "Applicant deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting applicant",
    });
  }
};
