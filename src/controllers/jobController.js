import { Job } from "../models/jobs.js";
import { Applicant } from "../models/applicants.js";
import { User } from "../models/user.js";
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

/**
 * Get Job Details by ID
 */
export const getJobDetails = async (req, res) => {
  try {
    const { job_id } = req.query;

    if (!job_id) {
      return sendResponse(res, false, "Job ID is required");
    }

    const job = await Job.findById(job_id).populate('createdBy', 'fullName companyName companyLogo');

    if (!job) {
      return sendResponse(res, false, "Job not found");
    }

    // Get application count
    const applicationCount = await Applicant.countDocuments({ jobId: job_id });

    // Format the job data for frontend
    const jobData = {
      job_id: job._id,
      title: job.jobTitle,
      company_name: job.createdBy?.fullName || 'Unknown Company',
      company_logo: job.createdBy?.companyLogo || null,
      verified: true, // You can add verification logic here
      location: job.location,
      employer_rating: 4.5, // Mock rating, you can calculate from reviews
      duration: "Recently posted", // You can calculate this
      views: "10 people viewed", // Mock data
      valid_till: job.startdate,
      time: "9:00 AM - 5:00 PM", // Default time
      salary: job.salary,
      applied: applicationCount,
      capacity: job.vacancy,
      description: job.jobDescription,
      total_vacancy: job.vacancy,
      no_of_vacancy: applicationCount,
      job_role: job.jobRole,
      job_posted_on: job.createdAt.toISOString().split('T')[0],
      start_date: job.startdate.toISOString().split('T')[0],
      exp_level: job.exp_level,
      skills: job.skills || [],
      status: job.status
    };

    return sendResponse(res, true, "Job details fetched successfully", jobData);
  } catch (error) {
    console.error('Get job details error:', error);
    return sendResponse(res, false, error.message || "Error fetching job details");
  }
};

/**
 * Get Employer Job Data with Applicants
 */
export const getEmployerJobData = async (req, res) => {
  try {
    const { job_id, tab_name } = req.query;
    const userId = req.user?.id;

    if (!job_id) {
      return sendResponse(res, false, "Job ID is required");
    }

    // Get job details
    const job = await Job.findById(job_id).populate('createdBy', 'fullName companyName companyLogo');

    if (!job) {
      return sendResponse(res, false, "Job not found");
    }

    // Check if user owns this job
    if (job.createdBy._id.toString() !== userId) {
      return sendResponse(res, false, "Unauthorized access to job");
    }

    let responseData = {};

    switch (tab_name) {
      case 'job_details':
        responseData = {
          description: job.jobDescription,
          total_vacancy: job.vacancy,
          applied: 0, // Will be calculated below
          job_role: job.jobRole,
          start_date: job.startdate.toISOString().split('T')[0],
          salary: job.salary,
          exp_level: job.exp_level,
          skills: job.skills,
          status: job.status
        };

        // Get applicant count
        const applicantCount = await Applicant.countDocuments({ jobId: job_id });
        responseData.applied = applicantCount;
        break;

      case 'applicants':
        // Get all applicants for this job
        const applicants = await Applicant.find({ jobId: job_id })
          .populate('userId', 'fullName email phone profilePicture experience skills')
          .sort({ createdAt: -1 });

        responseData = {
          applicants: applicants.map(applicant => ({
            id: applicant._id,
            user_id: applicant.userId._id,
            name: applicant.userId.fullName,
            email: applicant.userId.email,
            phone: applicant.userId.phone,
            profile_picture: applicant.userId.profilePicture,
            experience: applicant.userId.experience,
            skills: applicant.userId.skills,
            status: applicant.status,
            applied_date: applicant.createdAt,
            rating: applicant.rating || 0
          })),
          total_applicants: applicants.length,
          pending_count: applicants.filter(a => a.status === 'applied').length,
          approved_count: applicants.filter(a => a.status === 'approved').length,
          rejected_count: applicants.filter(a => a.status === 'rejected').length
        };
        break;

      case 'analytics':
        // Mock analytics data for now
        responseData = {
          views: Math.floor(Math.random() * 1000) + 500,
          applications: Math.floor(Math.random() * 50) + 10,
          conversion_rate: Math.floor(Math.random() * 30) + 5,
          avg_response_time: Math.floor(Math.random() * 48) + 2,
          top_skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          application_trends: [
            { day: 'Mon', applications: Math.floor(Math.random() * 10) },
            { day: 'Tue', applications: Math.floor(Math.random() * 10) },
            { day: 'Wed', applications: Math.floor(Math.random() * 10) },
            { day: 'Thu', applications: Math.floor(Math.random() * 10) },
            { day: 'Fri', applications: Math.floor(Math.random() * 10) },
            { day: 'Sat', applications: Math.floor(Math.random() * 5) },
            { day: 'Sun', applications: Math.floor(Math.random() * 5) }
          ]
        };
        break;

      default:
        return sendResponse(res, false, "Invalid tab name");
    }

    return sendResponse(res, true, "Job data retrieved successfully", responseData);

  } catch (error) {
    console.error('Get employer job data error:', error);
    return sendResponse(res, false, error.message || "Error fetching job data");
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

/**
 * Get Employer Dashboard Overview
 */
export const getEmployerDashboardOverview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { allFlag = true } = req.query;

    // Get employer's jobs
    const jobs = await Job.find({ createdBy: userId });

    // Calculate statistics
    const totalJobsPosted = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const closedJobs = jobs.filter(job => job.status === 'closed').length;

    // Get applications for employer's jobs
    const jobIds = jobs.map(job => job._id);
    const applications = await Applicant.find({ jobId: { $in: jobIds } });

    const approvedApplications = applications.filter(app => app.status === 'approved').length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;

    // Get today's applications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysApplications = applications.filter(app => {
      const appDate = new Date(app.createdAt);
      return appDate >= today && appDate < tomorrow;
    });

    // Get recent job updates
    const recentJobs = await Job.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'fullName');

    // Get top employees (those with most completed jobs)
    const topEmployees = await Applicant.aggregate([
      { $match: { jobId: { $in: jobIds }, status: 'approved' } },
      {
        $group: {
          _id: '$userId',
          jobsCompleted: { $sum: 1 },
          totalRating: { $sum: '$rating' },
          ratingCount: { $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          employee_name: '$user.fullName',
          jobs_completed: '$jobsCompleted',
          rating: {
            $cond: {
              if: { $gt: ['$ratingCount', 0] },
              then: { $divide: ['$totalRating', '$ratingCount'] },
              else: 0
            }
          }
        }
      },
      { $sort: { jobs_completed: -1 } },
      { $limit: 5 }
    ]);

    // Get top roles by applications
    const topRoles = await Job.aggregate([
      { $match: { createdBy: userId } },
      {
        $lookup: {
          from: 'applicants',
          localField: '_id',
          foreignField: 'jobId',
          as: 'applications'
        }
      },
      {
        $project: {
          job_title: '$jobRole',
          jobs: { $size: '$applications' },
          hires: {
            $size: {
              $filter: {
                input: '$applications',
                as: 'app',
                cond: { $eq: ['$$app.status', 'approved'] }
              }
            }
          }
        }
      },
      { $sort: { jobs: -1 } },
      { $limit: 5 }
    ]);

    const dashboardData = {
      stats: {
        total_jobs_posted: totalJobsPosted,
        active_jobs: activeJobs,
        closed_jobs: closedJobs,
        completed_jobs: completedJobs,
        approved_applications: approvedApplications,
        pending_applications: pendingApplications,
      },
      ongoingcount: activeJobs,
      applicants_today: {
        applicants_applied: todaysApplications.length,
        date: today.toISOString().split('T')[0]
      },
      job_updates: recentJobs.map(job => ({
        job_id: job._id,
        job_role: job.jobRole,
        location: job.location,
        start_date: job.startdate,
        start_time: '09:00 AM', // Default time
        end_time: '05:00 PM',   // Default time
        salary: job.salary,
        no_of_applications: applications.filter(app => app.jobId.toString() === job._id.toString()).length,
        total_vacancy: job.vacancy,
        status: job.status,
        posted_on: job.createdAt
      })),
      topEmployees,
      top_roles: topRoles,
      data_available: true
    };

    res.json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: dashboardData
    });

  } catch (error) {
    console.error('Employer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching dashboard data"
    });
  }
};

/**
 * Get Employee Dashboard Overview
 */
export const getEmployeeDashboardOverview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude } = req.query;

    // Get employee's applications and stats
    const applications = await Applicant.find({ userId })
      .populate('jobId')
      .sort({ createdAt: -1 });

    const appliedJobs = applications.length;
    const approvedJobs = applications.filter(app => app.status === 'approved').length;
    const rejectedJobs = applications.filter(app => app.status === 'rejected').length;
    const completedJobs = applications.filter(app => app.status === 'completed').length;

    // Get saved jobs (assuming you have a saved jobs feature)
    const savedJobs = 0; // TODO: Implement saved jobs feature

    // Get profile view count (assuming you track this)
    const profileView = Math.floor(Math.random() * 50) + 10; // Mock data

    // Get recommended jobs based on skills/location
    let recommendedJobs = [];

    if (latitude && longitude) {
      // Find jobs within radius (simplified - you might want to use geospatial queries)
      const nearbyJobs = await Job.find({
        status: 'active',
        createdBy: { $ne: userId } // Don't show own jobs
      })
      .populate('createdBy', 'fullName companyName')
      .sort({ createdAt: -1 })
      .limit(10);

      // Filter out already applied jobs
      const appliedJobIds = applications.map(app => app.jobId?.toString());
      recommendedJobs = nearbyJobs.filter(job => !appliedJobIds.includes(job._id.toString()));
    } else {
      // Get recent active jobs if no location
      recommendedJobs = await Job.find({
        status: 'active',
        createdBy: { $ne: userId }
      })
      .populate('createdBy', 'fullName companyName')
      .sort({ createdAt: -1 })
      .limit(10);
    }

    // Calculate earnings (from completed jobs)
    const earnings = applications
      .filter(app => app.status === 'completed')
      .reduce((total, app) => {
        // Assuming job has salary field
        return total + (app.jobId?.salary || 0);
      }, 0);

    // Get application history for dashboard
    const applicationHistory = applications.slice(0, 5).map(app => ({
      job_title: app.jobId?.jobTitle || 'Unknown Job',
      company_name: app.jobId?.createdBy?.fullName || 'Unknown Company',
      company_logo: app.jobId?.createdBy?.companyLogo || null,
      role: app.jobId?.jobRole || 'Unknown Role',
      date_applied: app.createdAt.toISOString().split('T')[0],
      status: app.status,
      salary: app.jobId?.salary || 0
    }));

    // Generate earnings chart data (mock data for 7 days)
    const earningsChart = {};
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((day, index) => {
      // Generate some mock earnings data
      earningsChart[day] = Math.floor(Math.random() * 100) + 20;
    });

    // Generate applications chart data (mock data for 7 days)
    const applicationsChart = {};
    days.forEach((day, index) => {
      // Generate some mock application data
      applicationsChart[day] = Math.floor(Math.random() * 10) + 1;
    });

    const dashboardData = {
      stats: {
        applied_jobs: appliedJobs,
        rejected_jobs: rejectedJobs,
        saved_jobs: savedJobs,
        profile_view: profileView,
        completed: completedJobs,
        approved_jobs: approvedJobs
      },
      overview: {
        applied: appliedJobs,
        save: savedJobs,
        approved: approvedJobs,
        reject: rejectedJobs,
        "on-going": applications.filter(app => app.status === 'approved' && app.jobId?.status === 'active').length,
        completed: completedJobs
      },
      recommended_jobs: recommendedJobs.map(job => ({
        id: job._id,
        title: job.jobTitle,
        company: job.createdBy?.fullName || 'Unknown Company',
        location: job.location,
        salary: job.salary,
        skills: job.skills || [],
        posted_date: job.createdAt,
        type: job.exp_level || 'Full-time'
      })),
      earnings: {
        total_earned: earnings,
        this_month: Math.floor(earnings * 0.3), // Mock monthly data
        pending: Math.floor(earnings * 0.1)     // Mock pending data
      },
      earnings_chart: earningsChart,
      applications_chart: applicationsChart,
      application_history: applicationHistory,
      data_available: true
    };

    res.json({
      success: true,
      message: "Employee dashboard data fetched successfully",
      data: dashboardData
    });

  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching dashboard data"
    });
  }
};
