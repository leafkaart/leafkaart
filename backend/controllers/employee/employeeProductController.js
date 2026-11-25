const { STAFF_PRODUCT } = require("../../utils/productVisibility");
const { syncLowStockAlert } = require("../../utils/lowStock");
const { updateProduct } = require("../dealer/dealerProductController");
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
      title,
      customerPrice: price,
      categoryId: category,
      employeeId: req.user._id
    };

    const product = new Product(payload);
    appendProductActivity(product, { action: "Product Created", actor: req.user });
    await product.save();
    await syncLowStockAlert(product);
    res.json({ success: true, product });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// LIST PRODUCTS (Employee Only)
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find({ $or: [{ employeeId: req.user._id }, STAFF_PRODUCT] })
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
      $or: [{ employeeId: req.user._id }, STAFF_PRODUCT]
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

exports.updateProduct = updateProduct;

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
      employeeId: req.user._id,
      createdByRole: { $not: STAFF_PRODUCT.createdByRole }
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
