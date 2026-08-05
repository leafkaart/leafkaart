const Product = require('../../models/Product');
const { appendProductActivity } = require("../../utils/productActivity");

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { title, slug, price, category } = req.body;

    // Validation
    if (!title || !slug || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "title, slug, price, category are required"
      });
    }

    // Check duplicate slug
    const exists = await Product.findOne({ slug });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists"
      });
    }

    const payload = {
      ...req.body,
      employee: req.user._id,
      dealer: req.body.dealer || null
    };

    const product = await Product.create(payload);
    res.json({ success: true, product });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// LIST PRODUCTS (Employee Only)
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find({ employee: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, products });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET SINGLE PRODUCT
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      employee: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, product });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const previousSnapshot = product.toObject();

    Object.entries(req.body || {}).forEach(([key, value]) => {
      if (key === "slug") return;
      product[key] = value;
    });

    const changedFields = Object.entries(req.body || {}).filter(([key, value]) => {
      if (key === "slug") return false;
      return String(previousSnapshot[key] ?? "") !== String(value ?? "");
    });

    if (changedFields.length) {
      appendProductActivity(product, {
        action: "Product Updated",
        actor: req.user,
        previousValue: Object.fromEntries(changedFields.map(([key]) => [key, previousSnapshot[key]])),
        newValue: Object.fromEntries(changedFields.map(([key, value]) => [key, value])),
        remarks: `Updated ${changedFields.map(([key]) => key).join(", ")}`,
      });
      await product.save();
    }

    res.json({ success: true, product });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commission, customerPrice } = req.body;

    if (commission === undefined || customerPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "commission and customerPrice are required",
      });
    }

    const updatedProduct = await Product.findById(id);

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const previousCommission = Number(updatedProduct.commission || 0);
    const previousCustomerPrice = Number(updatedProduct.customerPrice || 0);
    const previousDealerPrice = Number(updatedProduct.dealerPrice || 0);
    const nextCommission = Number(commission);
    const nextCustomerPrice = Number(customerPrice);

    updatedProduct.commission = nextCommission;
    updatedProduct.customerPrice = nextCustomerPrice;

    appendProductActivity(updatedProduct, {
      action: "Commission Updated",
      actor: req.user,
      previousValue: previousCommission,
      newValue: nextCommission,
      remarks: "Commission updated by employee",
    });

    appendProductActivity(updatedProduct, {
      action: "Customer Price Updated",
      actor: req.user,
      previousValue: previousCustomerPrice,
      newValue: nextCustomerPrice,
      remarks: "Customer price updated with commission change",
    });

    appendProductActivity(updatedProduct, {
      action: "Margin Updated",
      actor: req.user,
      previousValue: previousCustomerPrice - previousDealerPrice,
      newValue: nextCustomerPrice - previousDealerPrice,
      remarks: "Margin updated after commission change",
    });

    await updatedProduct.save();

    return res.status(200).json({
      success: true,
      message: "Commission updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update commission error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      employee: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, message: "Product deleted successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
