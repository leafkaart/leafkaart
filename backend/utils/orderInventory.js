const Product = require("../models/Product");

const STOCK_DEDUCT_STATUSES = new Set(["delivered"]);
const STOCK_RESTORE_STATUSES = new Set(["cancelled", "returned"]);

async function syncOrderInventory(order, nextStatus) {
  const status = String(nextStatus || "").toLowerCase();
  const currentState = order.inventoryStatus?.state || "none";

  if (!order?.items?.length || !status) {
    return false;
  }

  const shouldDeduct =
    STOCK_DEDUCT_STATUSES.has(status) && currentState !== "deducted";
  const shouldRestore =
    STOCK_RESTORE_STATUSES.has(status) && currentState === "deducted";

  if (!shouldDeduct && !shouldRestore) {
    return false;
  }

  for (const item of order.items) {
    const qty = Number(item.qty || 0);
    if (!qty) continue;

    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: shouldDeduct ? -qty : qty },
    });
  }

  order.inventoryStatus = {
    state: shouldDeduct ? "deducted" : "restored",
    status,
    updatedAt: new Date(),
  };

  return true;
}

module.exports = { syncOrderInventory };
