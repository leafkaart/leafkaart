const Banner = require("../../models/Banner");
const { uploadImageToCloudinary } = require("../../utils/imageUploader");

exports.createBanner = async (req, res) => {
  try {
    const { title, link, order, isActive } = req.body;

    if (!req.body.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    // Upload image to Cloudinary
    const upload = await uploadImageToCloudinary(req.body.file, "banners", 1200, 600);

    if (!upload || !upload.secure_url) {
      return res.status(500).json({ success: false, message: "Image upload failed" });
    }

    const banner = await Banner.create({
      imageUrl: upload.secure_url,
      alt: title || "Banner Image",
      title,
      link,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: "Banner created", banner });

  } catch (err) {
    console.error("createBanner error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.listBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: banners.length, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { title, link, order, isActive } = req.body;

    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

    if (req.file) {
      const upload = await uploadImageToCloudinary(req.file, "banners", 1200, 600);
      if (!upload || !upload.secure_url) return res.status(500).json({ success: false, message: "Image upload failed" });
      banner.imageUrl = upload.secure_url;
    }

    if (title !== undefined) banner.title = title;
    if (link !== undefined) banner.link = link;
    if (order !== undefined) banner.order = order;
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();

    res.json({ success: true, message: "Banner updated", banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

    await banner.deleteOne();
    res.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
