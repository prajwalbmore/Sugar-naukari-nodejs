import bcrypt from "bcryptjs";
import { User } from "../models/user.js";
import { generateToken } from "../utils/jwtUtils.js";
import { sendResponse } from "../utils/response.js";

export const register = async (req, res) => {
  try {
    const { fullName, email, password, mobile, role } = req.body;

    // 🔹 Validate required fields
    if (!fullName || !email || !password || !mobile || !role) {
      return sendResponse(res, false, "All required fields must be provided.");
    }

    // 🔹 Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return sendResponse(res, false, "Email already registered.");
    }

    // 🔹 Check if mobile already exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return sendResponse(res, false, "Mobile number already registered.");
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      mobile,
      role,
    });

    // 🔹 Send success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: newUser,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return sendResponse(
      res,
      false,
      error.message || "Server error during registration.",
    );
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        type: "email",
        message: "Invalid Email.",
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        type: "unauthorize",
        message: `Invalid Credentials`,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        type: "password",
        message: "Invalid Password.",
      });
    }

    const payload = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isActive: user.isActive,
      isprofileCreated: user.isprofileCreated,
      raw: user,
    };

    const token = generateToken(payload);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken: token,
        user,
      },
    });
  } catch (error) {
    console.log("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

export const refreshUser = async (req, res) => {
  try {
    // req.user is set by JWT auth middleware
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or deleted",
      });
    }

    // Create fresh payload for token
    const payload = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isActive: user.isActive,
      isprofileCreated: user.isprofileCreated,
      raw: user,
    };

    const newToken = generateToken(payload);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newToken,
      // data: payload,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
