import express from "express";
import User from "../models/user.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import sendOTP from "../utils/sendOTP.js";
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  const { name, userName, email, password } = req.body;
  try {
    const userExists = await User.findOne({ $or: [{ email }, { userName }] }); // Check for existing email OR userName
    if (userExists) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    const user = await User.create({ name, userName, email, password });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      await sendOTP(user.email, otp);

      return res.status(201).json({
        message: "OTP sent to your email. Please verify.",
        userId: user._id
      });
    } else {
      res.status(400).json({ message: "Invalid User Data" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        // Generate OTP and send again
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendOTP(user.email, otp);

        return res.status(200).json({
          message: "Account not verified. OTP sent to your email.",
          userId: user._id,
        });
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: accessToken,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "OTP verified successfully",
      token: accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
};


//refresh token

export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token, please login again" });
    }

    // Verify Refresh Token
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token, please login again" });
      }

      // Find User
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate New Access Token
      const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      res.json({ token: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
