const mongoose = require('mongoose');
const Category = require('../../models/Category');
const { uploadImageToCloudinary } = require("../../utils/imageUploader");

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name required" });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    // 🔹 Image validation
    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: "Category image is required",
      });
    }

    const image = req.files.images; // single image

    // Optional: size check (5MB)
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5MB",
      });
    }
x
    // 🔹 Upload to Cloudinary
    const upload = await uploadImageToCloudinary(
      image,
      process.env.FOLDER_NAME || "categories",
      500,
      500
    );

    if (!upload || !upload.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }

    const category = await Category.create({
      name,
      images: upload.secure_url,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category
    });

  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// List Categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.json({
      success: true,
      data: categories
    });

  } catch (err) {
    console.error("listCategories error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name && name.trim() !== "") {
      category.name = name.trim();
    }

    if (req.files && req.files.images) {
      const image = req.files.images;

      if (image.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size must be less than 5MB",
        });
      }

      const upload = await uploadImageToCloudinary(
        image,
        process.env.FOLDER_NAME || "categories",
        500,
        500
      );

      if (!upload || !upload.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }

      category.images = upload.secure_url;
    }

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });

  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid id" });

    const removed = await Category.findByIdAndDelete(id);

    if (!removed)
      return res.status(404).json({ success: false, message: "Category not found" });

    res.json({ success: true, message: "Category deleted" });

  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
