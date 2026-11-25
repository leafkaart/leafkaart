const Order = require("../models/Order");
const Product = require("../models/Product");
const { syncLowStockAlert } = require("./lowStock");

const STOCK_DEDUCT_STATUSES = new Set(["delivered"]);
const STOCK_RESTORE_STATUSES = new Set(["cancelled", "returned", "refunded"]);

async function runOrderChange(work) {
  const result = await Order.db.transaction(async (session) => {
    const changedProducts = new Set();
    async function syncInventory(order, status) {
      const state = order.inventoryStatus?.state || "none";
      const deduct = STOCK_DEDUCT_STATUSES.has(status) && state !== "deducted";
      const restore = STOCK_RESTORE_STATUSES.has(status) && state === "deducted";
      if ((!deduct && !restore) || !order.items?.length) return;

      for (const item of order.items) {
        const quantity = Number(item.qty);
        if (!Number.isSafeInteger(quantity) || quantity < 1) continue;
        const result = await Product.updateOne(
          { _id: item.product, ...(deduct && { stock: { $gte: quantity } }) },
          { $inc: { stock: deduct ? -quantity : quantity } },
          { session }
        );
        if (deduct && !result.matchedCount) {
          throw Object.assign(new Error(`Insufficient stock for ${item.title}`), { status: 409 });
        }
        if (result.matchedCount) changedProducts.add(String(item.product));
      }
      order.inventoryStatus = { state: deduct ? "deducted" : "restored", status, updatedAt: new Date() };
    }
    const value = await work(session, syncInventory);
    return { value, changedProducts };
  });
  for (const id of result.changedProducts) await syncLowStockAlert({ _id: id });
  return result.value;
}

module.exports = { runOrderChange };
