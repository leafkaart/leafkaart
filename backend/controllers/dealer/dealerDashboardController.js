const Product = require("../../models/Product");
const Order = require("../../models/Order");

exports.getDealerDashboard = async (req, res) => {
  try {
    const dealerId = req.user._id;

    const [products, orders, recentProducts, recentOrders] = await Promise.all([
      Product.countDocuments({ dealerId }),
      Order.countDocuments({ "dealerAssign.dealer": dealerId }),
      Product.find({ dealerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("categoryId", "name")
        .populate("subCategoryId", "name")
        .populate("dealerId", "name email"),
      Order.find({ "dealerAssign.dealer": dealerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email mobile")
        .populate("dealerAssign.dealer", "name email storeName"),
    ]);

    const revenueAgg = await Order.aggregate([
      {
        $match: {
          "dealerAssign.dealer": dealerId,
          status: { $in: ["delivered", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$dealerShowGrandTotal" },
        },
      },
    ]);

    const activeProducts = await Product.countDocuments({
      dealerId,
      isActive: true,
    });

    const approvedProducts = await Product.countDocuments({
      dealerId,
      isApproved: true,
    });

    const lowStockProducts = await Product.find({
      dealerId,
      stock: { $lt: 20 },
    })
      .sort({ stock: 1, updatedAt: -1 })
      .select("title sku stock dealerId createdAt updatedAt")
      .populate("dealerId", "name email storeName");

    const deliveredOrders = await Order.countDocuments({
      "dealerAssign.dealer": dealerId,
      status: { $in: ["delivered", "completed"] },
    });

    const processingOrders = await Order.countDocuments({
      "dealerAssign.dealer": dealerId,
      status: "processing",
    });

    const pendingOrders = Math.max(orders - deliveredOrders - processingOrders, 0);
    const totalRevenue = revenueAgg[0]?.revenue || 0;

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          name: req.user.name,
          email: req.user.email,
          mobile: req.user.mobile,
          role: req.user.role,
          storeName: req.user.storeName,
          storeGstin: req.user.storeGstin,
          panCard: req.user.panCard,
          storeAddress: req.user.storeAddress,
          pinCode: req.user.pinCode,
          dealerPhotos: req.user.dealerPhotos || [],
          profilePic: req.user.profilePic || "",
          status: req.user.status,
          isActive: req.user.isActive,
          isVerified: req.user.isVerified,
        },
        stats: {
          revenue: {
            total: totalRevenue,
          },
          products: {
            total: products,
            active: activeProducts,
            approved: approvedProducts,
            lowStock: lowStockProducts.length,
          },
          orders: {
            total: orders,
            processing: processingOrders,
            delivered: deliveredOrders,
            pending: pendingOrders,
          },
        },
        recentProducts,
        recentOrders,
        lowStockProducts,
      },
    });
  } catch (err) {
    console.error("getDealerDashboard error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
