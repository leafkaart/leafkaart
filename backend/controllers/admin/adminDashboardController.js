const mongoose = require("mongoose");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Dealer = require("../../models/Dealer");

exports.completeDashboard = async (req, res) => {
  try {
    const { from, to, groupBy = "day" } = req.query;

    const now = new Date();

    // ✅ Date Filters
    let matchFilter = {};
    if (from && to) {
      matchFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    // ✅ Default fallback (last 7 days)
    if (!from || !to) {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      matchFilter.createdAt = { $gte: last7Days };
    }

    // ✅ Month calculations (for growth)
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOrders,
      totalProducts,
      totalDealers,
      totalRevenueAgg,

      currentMonthOrders,
      lastMonthOrders,

      currentMonthRevenueAgg,
      lastMonthRevenueAgg,
    ] = await Promise.all([
      Order.countDocuments(),

      Product.countDocuments(),

      Dealer.countDocuments(),

      Order.aggregate([
        { $match: { status: { $in: ["delivered", "completed"] } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),

      // ✅ current month orders
      Order.countDocuments({
        createdAt: { $gte: startOfThisMonth },
      }),

      // ✅ last month orders
      Order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),

      // ✅ current month revenue
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfThisMonth },
            status: { $in: ["delivered", "completed"] },
          },
        },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),

      // ✅ last month revenue
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            status: { $in: ["delivered", "completed"] },
          },
        },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.revenue || 0;
    const currentMonthRevenue = currentMonthRevenueAgg[0]?.revenue || 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.revenue || 0;

    // ✅ Correct Growth Calculation
    const calcGrowth = (current, prev) =>
      prev === 0 ? 0 : Number((((current - prev) / prev) * 100).toFixed(2));

    const ordersGrowth = calcGrowth(currentMonthOrders, lastMonthOrders);
    const revenueGrowth = calcGrowth(
      currentMonthRevenue,
      lastMonthRevenue
    );

    // ✅ Dynamic GroupBy (day/month)
    const dateFormat =
      groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";

    const salesChart = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt",
            },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderId totalAmount status createdAt");

    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          soldQty: { $sum: "$items.quantity" },
        },
      },
      { $sort: { soldQty: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.title",
          soldQty: 1,
        },
      },
    ]);

    const lowStockProducts = await Product.find({
      stock: { $lte: 5 },
    })
      .limit(5)
      .select("title stock");

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          totalRevenue,
          totalProducts,
          totalDealers,
          ordersGrowth,
          revenueGrowth,
        },
        salesChart,
        recentOrders,
        topProducts,
        lowStockProducts,
      },
    });
  } catch (err) {
    console.error("dashboard err", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};