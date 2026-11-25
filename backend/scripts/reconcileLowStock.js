const mongoose = require("mongoose");
require("dotenv").config();
const Product = require("../models/Product");
const { LOW_STOCK_THRESHOLD, syncLowStockAlert } = require("../utils/lowStock");

async function main() {
  const [mode = "--dry-run"] = process.argv.slice(2);
  if (!["--dry-run", "--apply"].includes(mode)) throw new Error("Use --dry-run or --apply");
  await mongoose.connect(process.env.MONGODB_URL);
  const query = { stock: { $lt: LOW_STOCK_THRESHOLD } };
  console.log(`Products under ${LOW_STOCK_THRESHOLD}: ${await Product.countDocuments(query)}`);
  if (mode !== "--apply") return;
  for await (const product of Product.find(query).select("_id").cursor()) {
    await syncLowStockAlert(product);
  }
}

main().catch((error) => {
  console.error("Stock alert reconciliation stopped", error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
