const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

exports.addToCart = async (req, res) => {
  try {
    const { productId, qty } = req.body;

    // Validate inputs
    if (!productId || !qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "productId and qty (>=1) are required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
      });
    }

    // Check if product already exists in cart
    const existing = cart.items.find(
      (i) => i.product.toString() === productId
    );

    if (existing) {
      existing.qty += qty;

      if (existing.qty < 1) existing.qty = 1;

      // Stock re-check after update
      if (existing.qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Updated quantity exceeds available stock",
        });
      }
    } else {
      cart.items.push({
        product: productId,
        qty,
        priceAt: product.offerPrice || product.price,
      });
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (sum, i) => sum + i.qty * i.priceAt,
      0
    );

    await cart.save();

    return res.json({
      success: true,
      message: "Added to cart",
      cart,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    return res.json({
      success: true,
      cart: cart || { items: [], totalAmount: 0 },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { qty } = req.body;

    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "qty must be >= 1",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Check stock
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product no longer exists",
      });
    }

    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Requested qty exceeds available stock",
      });
    }

    item.qty = qty;

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (sum, i) => sum + i.qty * i.priceAt,
      0
    );

    await cart.save();

    return res.json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const exists = cart.items.some(
      (i) => i._id.toString() === req.params.id
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    cart.items = cart.items.filter(
      (i) => i._id.toString() !== req.params.id
    );

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (sum, i) => sum + i.qty * i.priceAt,
      0
    );

    await cart.save();

    return res.json({
      success: true,
      message: "Item removed",
      cart,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
