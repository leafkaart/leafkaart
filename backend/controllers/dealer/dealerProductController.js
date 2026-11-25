const mongoose = require("mongoose");
const { catalogFor, customerCatalog, STAFF_PRODUCT } = require("../../utils/productVisibility");
const { IMAGE_TYPES, validateUpload } = require("../../utils/validateUpload");
const { syncLowStockAlert } = require("../../utils/lowStock");
const Product = require("../../models/Product");
const Category = require("../../models/Category");
const SubCategory = require("../../models/SubCategory");
const { uploadImageToCloudinary } = require("../../utils/imageUploader");
const { appendProductActivity } = require("../../utils/productActivity");
const {
  getUserIdsByRoles,
  createAndSendNotifications,
} = require("../../utils/notificationHelper");

async function uploadProductImage(file) {
  try {
    const asset = await uploadImageToCloudinary(file, process.env.FOLDER_NAME, 1000, "auto", {
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png"],
    });
    if (!asset?.secure_url) throw new Error("Missing product image URL");
    return asset;
  } catch (error) {
    console.error("Product image upload failed", error);
    throw Object.assign(new Error("Could not upload the product image. Please try again."), { status: 502 });
  }
}

const getUploadedImages = (req) => {
  const rawImages =
    req.files?.images ||
    req.files?.image ||
    req.files?.["images[]"];

  if (!rawImages) return [];

  const images = Array.isArray(rawImages) ? rawImages : [rawImages];
  return images.filter(Boolean);
};

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeImages = (images, title) =>
  images.map((image, index) => ({
    url: image.url,
    alt: image.alt || title || "Product image",
    order: image.order ?? index + 1,
  }));

const mapImageUrls = (images = []) =>
  images
    .map((image) => (typeof image === "string" ? image : image?.url))
    .filter(Boolean);

const buildProductSavedPayload = (product, updates = {}) => {
  const next = { ...updates };

  if (typeof next.serialNumber === "string") {
    next.serialNumber = next.serialNumber.trim();
  }

  if (typeof next.warranty === "string") {
    next.warranty = next.warranty.trim();
  }

  if (typeof (next.modelNumber || next.modalNumber) === "string") {
    next.modelNumber = (next.modelNumber || next.modalNumber).trim();
  }

  delete next.modalNumber;
  delete next.isApproved;
  delete next.approvedAt;
  delete next.approvedBy;

  if (next.dealerPrice !== undefined) {
    next.dealerPrice = parseNumber(next.dealerPrice, product.dealerPrice);
  }

  if (next.customerPrice !== undefined) {
    next.customerPrice = parseNumber(next.customerPrice, product.customerPrice);
  }

  if (next.stock !== undefined) {
    next.stock = parseNumber(next.stock, product.stock);
  }

  return next;
};

exports.createProduct = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    const {
      title,
      categoryId,
      subCategoryId,
      dealerPrice,
      stock,
      sku,
      brand,
      shortDescription,
      warranty,
      serialNumber,
      modelNumber,
      
    } = req.body;

    if (typeof title !== "string" || !title.trim())
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });

    if (!categoryId)
      return res
        .status(400)
        .json({ success: false, message: "Category ID is required" });

    if (!subCategoryId)
      return res
        .status(400)
        .json({ success: false, message: "Sub-category ID is required" });

    if (!Number.isSafeInteger(Number(stock ?? 0)) || Number(stock) < 0)
      return res
        .status(400)
        .json({ success: false, message: "Stock must be a non-negative whole number" });

    if (!mongoose.isValidObjectId(categoryId) || !mongoose.isValidObjectId(subCategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid category or subcategory" });
    }
    if (dealerPrice == null || dealerPrice === "" || !Number.isFinite(Number(dealerPrice)) || Number(dealerPrice) < 0) {
      return res.status(400).json({ success: false, message: "Price must be a non-negative number" });
    }
    const category = await Category.findById(categoryId);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    const sub = await SubCategory.findOne({ _id: subCategoryId, categoryId });
    if (!sub)
      return res.status(404).json({
        success: false,
        message: "Sub-category not found for selected category",
      });

    let uploadedImages = [];

    const images = getUploadedImages(req);

    if (!images.length) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    if (images.length > 6) {
      return res.status(400).json({
        success: false,
        message: "You can upload maximum 6 images",
      });
    }

    images.forEach((image) => validateUpload(image, IMAGE_TYPES, "Product image"));
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const upload = await uploadProductImage(img);

      uploadedImages.push({
        url: upload.secure_url,
        alt: title || "Product image",
        order: i + 1,
      });
    }

    const product = new Product({
      title,
      categoryId,
      subCategoryId,
      dealerPrice: parseNumber(dealerPrice, 0),
      customerPrice: parseNumber(dealerPrice, 0),
      stock: parseNumber(stock, 0),
      sku,
      brand,
      shortDescription,
      warranty,
      serialNumber,
      modelNumber,
      images: normalizeImages(uploadedImages, title),
      dealerId: isAdmin ? undefined : req.user._id,
      isApproved: isAdmin,
      ...(isAdmin && {
        dealerVisible: ![false, "false"].includes(req.body.dealerVisible),
        isActive: ![false, "false"].includes(req.body.isActive),
        approvedAt: new Date(),
        approvedBy: req.user._id,
      }),
    });

    appendProductActivity(product, {
      action: "Product Created",
      actor: req.user,
      previousValue: null,
      newValue: {
        title,
        categoryId,
        subCategoryId,
        dealerPrice: parseNumber(dealerPrice, 0),
        stock: parseNumber(stock, 0),
        imageCount: uploadedImages.length,
      },
      remarks: "Product created successfully",
    });

    await product.save();

    await syncLowStockAlert(product);
    const adminAndEmployeeIds = isAdmin ? [] : await getUserIdsByRoles(["admin", "employee"]).catch((error) => {
      console.error("Product recipient lookup failed", error);
      return [];
    });
    await createAndSendNotifications({
      userIds: adminAndEmployeeIds,
      productId: product._id,
      message: `New Product Added: ${title}`,
      type: "product",
    }).catch((error) => console.error("Product notification failed", error));

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    if (!err.status) console.error("createProduct error:", err);
    res.status(err.status || (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500)).json({
      success: false,
      message: err.status ? err.message : err.name === "ValidationError" || err.name === "CastError"
        ? "One or more product fields are invalid" : "Could not save the product. Please try again.",
    });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const filter = { $and: [catalogFor(req.user)] };
    if (req.query.view === "admin") filter.$and.push(STAFF_PRODUCT);
    if (req.query.view === "available") {
      filter.$and.push(customerCatalog);
    }

    // Category filter
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }

    // Subcategory filter
    if (req.query.subCategoryId) {
      filter.subCategoryId = req.query.subCategoryId;
    }

    // Search filter
    if (req.query.search) {
      const search = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .populate("dealerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("listProducts error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ...catalogFor(req.user),
    });

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("getProduct error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      ...(req.user.role === "dealer" && { dealerId: req.user._id }),
      ...(req.user.role === "employee" && { $or: [STAFF_PRODUCT, { employeeId: req.user._id }] }),
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const input = req.body || {};
    for (const field of ["stock", "dealerPrice", "customerPrice"]) {
      if (input[field] === undefined) continue;
      const number = Number(input[field]);
      if (input[field] === "" || !Number.isFinite(number) || number < 0 ||
          (field === "stock" && !Number.isSafeInteger(number))) {
        return res.status(400).json({ success: false, message: `Invalid ${field}` });
      }
    }
    if (input.categoryId !== undefined || input.subCategoryId !== undefined) {
      const categoryId = input.categoryId ?? product.categoryId;
      const subCategoryId = input.subCategoryId ?? product.subCategoryId;
      if (!mongoose.isValidObjectId(categoryId) || !mongoose.isValidObjectId(subCategoryId) ||
          !await SubCategory.exists({ _id: subCategoryId, categoryId })) {
        return res.status(400).json({ success: false, message: "Invalid category or subcategory" });
      }
    }
    if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim())) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    const updates = buildProductSavedPayload(product, input);

    let uploadedImages = [];
    const activityEntries = [];
    const previousImages = mapImageUrls(product.images || []);

    // New image files (appended after any kept existing images)
    const images = getUploadedImages(req);

    // Existing images to keep, and in what order — omit an id to delete it,
    // reorder the array to reorder the gallery. Falls back to "keep everything
    // as-is" when the caller doesn't send this field, preserving old behavior.
    let keptExistingImages = product.images || [];
    const imagesTouched = req.body.existingImages !== undefined || images.length > 0;

    if (req.body.existingImages !== undefined) {
      let keepIds;
      try {
        keepIds = JSON.parse(req.body.existingImages);
      } catch (err) {
        keepIds = null;
      }
      if (!Array.isArray(keepIds)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid existingImages payload" });
      }
      const byId = new Map(
        (product.images || []).map((image) => [String(image._id), image])
      );
      keptExistingImages = keepIds.map((id) => byId.get(String(id))).filter(Boolean);
    }

    if (imagesTouched) {
      const totalCount = keptExistingImages.length + images.length;
      if (totalCount === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Please keep or upload at least one image" });
      }
      if (totalCount > 6)
        return res
          .status(400)
          .json({ success: false, message: "Max 6 images allowed" });

      images.forEach((image) => validateUpload(image, IMAGE_TYPES, "Product image"));
      for (const img of images) {
        const upload = await uploadProductImage(img);

        uploadedImages.push({
          url: upload.secure_url,
          alt: updates.title || product.title || "Product image",
        });
      }

      const mergedImages = [
        ...keptExistingImages.map((image) => ({ url: image.url, alt: image.alt })),
        ...uploadedImages,
      ];
      updates.images = normalizeImages(mergedImages, updates.title || product.title);
    }

    const originalDealerPrice = parseNumber(product.dealerPrice, 0);
    const originalCustomerPrice = parseNumber(product.customerPrice, 0);
    const originalCommission = parseNumber(product.commission, 0);

    const fieldGroups = [
      "title",
      "shortDescription",
      "warranty",
      "sku",
      "brand",
      "serialNumber",
      "modelNumber",
      "categoryId",
      "subCategoryId",
      "weightKg",
    ];

    const previousValues = {};
    const nextValues = {};

    fieldGroups.forEach((field) => {
      if (updates[field] !== undefined) {
        const prevValue = product[field];
        const nextValue = updates[field];
        const prevComparable = prevValue?._id ? String(prevValue._id) : String(prevValue ?? "");
        const nextComparable = nextValue?._id ? String(nextValue._id) : String(nextValue ?? "");

        if (prevComparable !== nextComparable) {
          previousValues[field] = prevValue?._id ? prevValue._id : prevValue;
          nextValues[field] = nextValue?._id ? nextValue._id : nextValue;
          product[field] = nextValue;
        }
      }
    });

    if (updates.dealerPrice !== undefined) {
      const nextDealerPrice = parseNumber(updates.dealerPrice, originalDealerPrice);
      if (nextDealerPrice !== originalDealerPrice) {
        product.dealerPrice = nextDealerPrice;
        activityEntries.push(
          {
            action: "Dealer Price Updated",
            previousValue: originalDealerPrice,
            newValue: nextDealerPrice,
            remarks: "Dealer price updated",
          },
          {
            action: "Margin Updated",
            previousValue: originalCustomerPrice - originalDealerPrice,
            newValue: parseNumber(product.customerPrice, 0) - nextDealerPrice,
            remarks: "Margin changed after dealer price update",
          }
        );
      }
    }

    if (updates.customerPrice !== undefined) {
      const nextCustomerPrice = parseNumber(updates.customerPrice, originalCustomerPrice);
      if (nextCustomerPrice !== originalCustomerPrice) {
        product.customerPrice = nextCustomerPrice;
        activityEntries.push(
          {
            action: "Customer Price Updated",
            previousValue: originalCustomerPrice,
            newValue: nextCustomerPrice,
            remarks: "Customer price updated",
          },
          {
            action: "Margin Updated",
            previousValue: originalCustomerPrice - originalDealerPrice,
            newValue: nextCustomerPrice - parseNumber(product.dealerPrice, originalDealerPrice),
            remarks: "Margin changed after customer price update",
          }
        );
      }
    }

    if (updates.commission !== undefined) {
      const nextCommission = parseNumber(updates.commission, originalCommission);
      if (nextCommission !== originalCommission) {
        product.commission = nextCommission;
        activityEntries.push({
          action: "Commission Updated",
          previousValue: originalCommission,
          newValue: nextCommission,
          remarks: "Commission updated",
        });
      }
    }

    if (updates.stock !== undefined) {
      const nextStock = parseNumber(updates.stock, parseNumber(product.stock, 0));
      if (nextStock !== parseNumber(product.stock, 0)) {
        const previousStock = parseNumber(product.stock, 0);
        product.stock = nextStock;
        activityEntries.push({
          action: "Stock Updated",
          previousValue: previousStock,
          newValue: nextStock,
          remarks: "Stock quantity updated",
        });
      }
    }

    if (updates.images) {
      const nextImages = mapImageUrls(updates.images);
      if (JSON.stringify(previousImages) !== JSON.stringify(nextImages)) {
        product.images = updates.images;
        activityEntries.push({
          action: "Product Images Updated",
          previousValue: previousImages,
          newValue: nextImages,
          remarks: `Updated ${nextImages.length} image${nextImages.length === 1 ? "" : "s"}`,
        });
      }
    }

    if (updates.isActive !== undefined) {
      const nextIsActive = ![false, "false"].includes(updates.isActive);
      if (nextIsActive !== Boolean(product.isActive)) {
        product.isActive = nextIsActive;
        activityEntries.push({
          action: nextIsActive ? "Product Activated" : "Product Deactivated",
          previousValue: Boolean(!nextIsActive),
          newValue: nextIsActive,
          remarks: nextIsActive ? "Product activated" : "Product deactivated",
        });
      }
    }

    if ((req.user.role === "admin" || STAFF_PRODUCT.createdByRole.test(product.createdByRole)) && updates.dealerVisible !== undefined) {
      const next = ![false, "false"].includes(updates.dealerVisible);
      if (next !== product.dealerVisible) {
        previousValues.dealerVisible = product.dealerVisible;
        nextValues.dealerVisible = next;
        product.dealerVisible = next;
      }
    }

    if (Object.keys(previousValues).length > 0) {
      activityEntries.push({
        action: "Product Updated",
        previousValue: previousValues,
        newValue: nextValues,
        remarks: `Updated ${Object.keys(previousValues).join(", ")}`,
      });
    }

    activityEntries.forEach((entry) => {
      appendProductActivity(product, {
        action: entry.action,
        actor: req.user,
        previousValue: entry.previousValue,
        newValue: entry.newValue,
        remarks: entry.remarks,
      });
    });

    if (activityEntries.length > 0) {
      await product.save();
      await syncLowStockAlert(product);
    }

    // ---------------- Real-time Socket Event ----------------
    // io.emit("product:updated", product);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    if (!err.status) console.error("updateProduct error:", err);
    res.status(err.status || (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500)).json({
      success: false,
      message: err.status ? err.message : err.name === "ValidationError" || err.name === "CastError"
        ? "One or more product fields are invalid" : "Could not save the product. Please try again.",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      dealerId: req.user._id,
    });

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // ---------------- Real-time Socket Event ----------------
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(err.status || (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500)).json({
      success: false,
      message: err.status ? err.message : err.name === "ValidationError" || err.name === "CastError"
        ? "One or more product fields are invalid" : "Could not save the product. Please try again.",
    });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock == null || stock === "" || !Number.isSafeInteger(Number(stock)) || Number(stock) < 0)
      return res
        .status(400)
        .json({ success: false, message: "Valid stock value required" });

    const product = await Product.findOne({
      _id: req.params.id,
      dealerId: req.user._id,
    });

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const previousStock = parseNumber(product.stock, 0);
    const nextStock = parseNumber(stock, previousStock);

    if (nextStock !== previousStock) {
      product.stock = nextStock;
      appendProductActivity(product, {
        action: "Stock Updated",
        actor: req.user,
        previousValue: previousStock,
        newValue: nextStock,
        remarks: "Stock quantity updated",
      });
      await product.save();
      await syncLowStockAlert(product);
    }

    // ---------------- Real-time Socket Event ----------------
    res.status(200).json({
      success: true,
      message: "Stock updated",
      data: product,
    });
  } catch (err) {
    console.error("updateStock error:", err);
    res.status(err.status || (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500)).json({
      success: false,
      message: err.status ? err.message : err.name === "ValidationError" || err.name === "CastError"
        ? "One or more product fields are invalid" : "Could not save the product. Please try again.",
    });
  }
};
