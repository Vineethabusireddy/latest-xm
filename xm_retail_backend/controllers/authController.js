import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { createTransport } from "nodemailer";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const otpStore = {};
const SECRET_KEY = process.env.JWT_SECRET;

// Email transporter setup
const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio client setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper functions
const formatPhoneNumber = (phone) => phone.replace(/\D/g, '').startsWith('+') ? phone.replace(/\D/g, '') : `+91${phone.replace(/\D/g, '')}`;

const isValidPhoneNumber = (phone) => phone.replace(/\D/g, '').length >= 10;

// Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    const identifier = email || phone;
    const now = Date.now();

    // Throttle OTP sending
    if (otpStore[identifier]?.timestamp && now - otpStore[identifier].timestamp < 60000) {
      return res.status(400).json({ message: "OTP already sent. Please wait a minute." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[identifier] = { otp, timestamp: now };

    if (email) {
      if (!email.includes('@') || !email.includes('.')) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
      });

      console.log(`✅ OTP ${otp} sent to email: ${email}`);
      return res.status(200).json({ message: "OTP sent to email" });
    } else {
      if (!isValidPhoneNumber(phone)) {
        return res.status(400).json({ message: "Please enter a valid phone number" });
      }

      const formattedPhone = formatPhoneNumber(phone);

      try {
        await twilioClient.messages.create({
          body:` Your OTP is: ${otp}. It expires in 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });

        console.log(`✅ OTP ${otp} sent to phone: ${formattedPhone}`);
        return res.status(200).json({ message: "OTP sent to phone" });
      } catch (twilioError) {
        console.error("Twilio error:", twilioError);
        return res.status(400).json({ 
          message: twilioError.code === 21211 
            ? "Invalid phone number format. Include country code (e.g., +919876543210)" 
            : "Failed to send SMS",
          error: twilioError.message 
        });
      }
    }
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    return res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    const identifier = email || phone;

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Email/phone and OTP are required" });
    }

    const record = otpStore[identifier];
    if (!record) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    const { otp: storedOtp, timestamp } = record;

    if (Date.now() - timestamp > 10 * 60 * 1000) {
      delete otpStore[identifier];
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedOtp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    delete otpStore[identifier];

    // Find user by either email or phone
    const whereClause = email ? { email } : { phone };
    let user = await User.findOne({ where: whereClause });

    let isNewUser = false;

    if (!user) {
      // Create new user with only the verified identifier
      const userData = {
        name: "New User",
        pincode: null,
        [email ? 'email' : 'phone']: identifier // Set the verified identifier
      };

      user = await User.create(userData);
      isNewUser = true;
      console.log(`✅ New user created: ${user.id}`);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        pincode: user.pincode
      },
      isNewUser,
    });
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    return res.status(500).json({ 
      message: "OTP verification failed",
      error: error.message 
    });
  }
};

// Save registration details
export const saveRegistration = async (req, res) => {
  try {
    const { name, phone, pincode, email, userId } = req.body;

    console.log('Registration data received:', { name, phone, pincode, email, userId });

    // Validate required fields
    if (!name || !userId) {
      return res.status(400).json({ 
        success: false,
        message: "Name and user ID are required",
        details: {
          name: !name ? "Name is required" : undefined,
          userId: !userId ? "User ID is required" : undefined
        }
      });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Prepare update data
    const updateData = { name };
    
    // Only update fields that are provided and valid
    if (phone) {
      if (/^\d{10,15}$/.test(phone)) {
        updateData.phone = phone;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
          details: {
            phone: "Must be 10-15 digits"
          }
        });
      }
    }

    if (pincode) {
      if (/^\d{6}$/.test(pincode)) {
        updateData.pincode = pincode;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid pincode format",
          details: {
            pincode: "Must be exactly 6 digits"
          }
        });
      }
    }

    if (email) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        updateData.email = email;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          details: {
            email: "Must be a valid email address"
          }
        });
      }
    }

    // Update the user
    await user.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Registration completed successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        pincode: user.pincode
      }
    });
  } catch (error) {
    console.error("❌ Error saving registration:", error);
    
    // Handle specific Sequelize errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      return res.status(400).json({ 
        success: false,
        message: `${field} already registered`,
        details: {
          [field]:`This ${field} is already in use`
        }
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};