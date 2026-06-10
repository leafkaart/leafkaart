const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const { uploadImageToCloudinary } = require("../../utils/imageUploader");
const {
  getUserIdsByRoles,
  createAndSendNotifications,
} = require("../../utils/notificationHelper");

exports.dealerRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      storeName,
      storeGstin,
      panCard,
      storeAddress,
      pinCode,
    } = req.body;
    const dealerPhotosInput = req.files?.dealerPhotos;
    const dealerPhotos = Array.isArray(dealerPhotosInput)
      ? dealerPhotosInput
      : dealerPhotosInput
        ? [dealerPhotosInput]
        : [];

    if (
      !name ||
      !email ||
      !password ||
      !mobile ||
      !storeName ||
      !storeGstin ||
      !panCard ||
      !storeAddress ||
      !pinCode
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (dealerPhotos.length < 3 || dealerPhotos.length > 5) {
      return res.status(400).json({
        message: "Please upload between 3 and 5 dealer photos",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uploadedPhotos = [];

    for (const file of dealerPhotos) {
      const upload = await uploadImageToCloudinary(
        file,
        "dealer-photos",
        1200,
        80
      );

      if (!upload?.secure_url) {
        return res
          .status(500)
          .json({ message: "Failed to upload dealer photo(s)" });
      }

      uploadedPhotos.push(upload.secure_url);
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      role: "dealer",
      storeName,
      storeGstin,
      panCard,
      storeAddress,
      pinCode,
      dealerPhotos: uploadedPhotos,
      isVerified: false,
      status: "pending",
    });

    const adminAndEmployeeIds = await getUserIdsByRoles(["admin", "employee"]);
    await createAndSendNotifications({
      userIds: adminAndEmployeeIds,
      message: `New Dealer Registered: ${user.name}`,
      type: "dealer",
    });

    return res.status(201).json({
      message: "Dealer registration successful. Wait for admin approval.",
      userId: user._id,
    });
  } catch (err) {
    console.error("Dealer Registration Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllDealers = async (req, res) => {
  try {
    const dealers = await User.find({ role: "dealer" }).select("-password");

    if (!dealers || dealers.length === 0) {
      return res.status(404).json({ message: "No dealers found" });
    }

    return res.status(200).json({
      message: "Dealers fetched successfully",
      total: dealers.length,
      data: dealers,
    });
  } catch (err) {
    console.error("Get Dealers Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isVerified, isActive } = req.body;

    const allowedStatus = ["approved", "rejected", "pending"];
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const dealer = await User.findOne({ _id: id, role: "dealer" });

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    const nextStatus = status || dealer.status;

    dealer.status = nextStatus;
    dealer.isVerified =
      isVerified !== undefined
        ? isVerified
        : nextStatus === "approved"
          ? true
          : dealer.isVerified;
    dealer.isActive =
      isActive !== undefined
        ? isActive
        : nextStatus === "approved"
          ? true
          : dealer.isActive;

    if (nextStatus === "approved") {
      dealer.approvedBy = req.user?._id || dealer.approvedBy;
      dealer.approvedAt = new Date();
    } else if (nextStatus === "rejected") {
      dealer.isVerified = false;
      dealer.isActive = false;
    }

    await dealer.save();

    return res.status(200).json({
      message: "Dealer status updated successfully",
      data: dealer,
    });
  } catch (err) {
    console.error("Approve Dealer Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;

    const dealer = await User.findOne({ _id: id, role: "dealer" });

    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    dealer.status = "rejected";
    dealer.isVerified = false;

    await dealer.save();

    return res.status(200).json({
      message: "Dealer rejected successfully",
      data: dealer,
    });
  } catch (err) {
    console.error("Reject Dealer Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
