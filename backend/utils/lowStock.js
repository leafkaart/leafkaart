const { Types } = require("mongoose");
const Product = require("../models/Product");
const { getUserIdsByRoles, createAndSendNotifications } = require("./notificationHelper");

const LOW_STOCK_THRESHOLD = 5;

async function syncLowStockAlert(product) {
  try {
    const id = product._id;
    await Product.updateOne(
      { _id: id, stock: { $gte: LOW_STOCK_THRESHOLD }, lowStockEvent: { $ne: null } },
      { $set: { lowStockEvent: null } },
      { timestamps: false }
    );
    const lowStock = { _id: id, stock: { $lt: LOW_STOCK_THRESHOLD } };
    const current = await Product.findOneAndUpdate(
      { ...lowStock, lowStockEvent: null },
      { $set: { lowStockEvent: new Types.ObjectId() } },
      { returnDocument: "after", timestamps: false }
    ) || await Product.findOne(lowStock);
    if (!current?.lowStockEvent) return;

    const isStaffInventory = /^admin$/i.test(current.createdByRole || "");
    if (!isStaffInventory && (current.isActive === false || current.dealerVisible === false)) return;
    const recipients = isStaffInventory
      ? await getUserIdsByRoles(["admin", "employee"])
      : [current.dealerId];

    await createAndSendNotifications({
      userIds: recipients,
      productId: id,
      message: `Low stock: ${current.title} has ${current.stock} units left.`,
      type: "product",
      eventKey: `low-stock:${current.lowStockEvent}`,
    });
  } catch (error) {
    console.error("Could not synchronize low-stock alert", error);
  }
}

module.exports = { LOW_STOCK_THRESHOLD, syncLowStockAlert };
