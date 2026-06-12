const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const VERIFY_SERVICE_SID = process.env.VERIFY_SERVICE_SID;

const formatMobile = (mobile) =>
  mobile.startsWith("+") ? mobile : `+91${mobile}`;

// ─── STEP 1: Send OTP (Register or Login) ────────────────────────────────────
// POST /customer/send-otp
// Body: { mobile }
// - New customer  → just send OTP (account created after verification)
// - Existing customer → send OTP for login
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const formattedMobile = formatMobile(mobile);

    await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to: formattedMobile, channel: "sms" });

    const existingUser = await User.findOne({ mobile, role:"customer" });
    const isNewUser = !existingUser;
    return res.status(200).json({
      message: "OTP sent successfully",
      isNewUser,
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── STEP 2a: Verify OTP + Register (New Customer) ───────────────────────────
// POST /customer/verify-register
// Body: { name, email, mobile, otp }
exports.verifyAndRegister = async (req, res) => {
  try {
    const { name, email, mobile, otp } = req.body;

    if (!name || !email || !mobile || !otp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ mobile, role: "customer" });
    if (existingUser) {
      return res.status(409).json({
        message: "Mobile already registered. Please login instead.",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Verify OTP with Twilio
    const formattedMobile = formatMobile(mobile);
    const check = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: formattedMobile, code: otp });

    if (check.status !== "approved") {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Create customer account (no password for mobile app)
    const user = await User.create({
      name,
      email,
      mobile,
      password: await bcrypt.hash(Math.random().toString(36), 10), // dummy password
      role: "customer",
      status: "approved",
      isVerified: true,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(201).json({
      message: "Customer registered and verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Verify & Register Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── STEP 2b: Verify OTP + Login (Existing Customer) ─────────────────────────
// POST /customer/verify-login
// Body: { mobile, otp }
exports.verifyAndLogin = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP are required" });
    }

    const user = await User.findOne({ mobile, role: "customer" });
    if (!user) {
      return res.status(404).json({
        message: "Customer not found. Please register first.",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({ message: "Your account has been disabled." });
    }

    // Verify OTP with Twilio
    const formattedMobile = formatMobile(mobile);

    let check;
    try {
      check = await twilioClient.verify.v2
        .services(VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: formattedMobile, code: otp });
    } catch (twilioErr) {
      // Twilio 404 → OTP session expired or never created
      if (twilioErr.status === 404 || twilioErr.code === 20404) {
        return res.status(400).json({
          message: "OTP has expired or was never sent. Please request a new OTP.",
        });
      }
      // Twilio 429 → too many attempts
      if (twilioErr.status === 429) {
        return res.status(429).json({
          message: "Too many attempts. Please request a new OTP.",
        });
      }
      // Any other Twilio error
      console.error("Twilio Error:", twilioErr);
      return res.status(502).json({
        message: "OTP verification service unavailable. Please try again.",
      });
    }

    if (check.status !== "approved") {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Verify & Login Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── ADMIN: Get All Customers ─────────────────────────────────────────────────
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" }).select("-password");

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: "No customers found" });
    }

    return res.status(200).json({
      message: "Customers fetched successfully",
      total: customers.length,
      data: customers,
    });
  } catch (err) {
    console.error("Get Customers Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── ADMIN: Update Customer ───────────────────────────────────────────────────
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, status, isVerified } = req.body;

    const customer = await User.findOne({ _id: id, role: "customer" });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (name) customer.name = name;
    if (email) customer.email = email;
    if (mobile) customer.mobile = mobile;
    if (status) customer.status = status;
    if (typeof isVerified !== "undefined") customer.isVerified = isVerified;

    await customer.save();

    return res.status(200).json({
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (err) {
    console.error("Update Customer Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── ADMIN: Delete (Disable) Customer ────────────────────────────────────────
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await User.findOne({ _id: id, role: "customer" });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.status = "rejected";
    customer.isVerified = false;
    await customer.save();

    return res.status(200).json({
      message: "Customer disabled successfully",
      data: customer,
    });
  } catch (err) {
    console.error("Delete Customer Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};