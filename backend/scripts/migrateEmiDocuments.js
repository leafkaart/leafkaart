const { createHash } = require("node:crypto");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const Order = require("../models/Order");
const { cloudinaryConnect } = require("../config/cloudinary");
const { REFERENCE_PREFIX, encodeAsset, legacyAsset, documentSource } = require("../utils/emiDocuments");

const FIXED_PATHS = [
  "addharfrontimage", "aadharbackimage", "pancardimage", "paymentImage",
  "emiDocuments.aadhaarFront", "emiDocuments.aadhaarBack", "emiDocuments.panCard",
];

async function main() {
  const [mode = "--dry-run"] = process.argv.slice(2);
  if (!["--dry-run", "--copy", "--revoke-legacy"].includes(mode)) {
    throw new Error("Use --dry-run, --copy, or --revoke-legacy");
  }
  cloudinaryConnect();
  await mongoose.connect(process.env.MONGODB_URL);
  const migratedAssets = new Map();
  let legacyCount = 0;
  let invalidCount = 0;
  let copied = 0;

  for await (const order of Order.find({ paymentMethod: "EMI" }).cursor()) {
    const fields = [...FIXED_PATHS, ...(order.emiDocuments?.otherDocuments || [])
      .map((_document, index) => `emiDocuments.otherDocuments.${index}.url`)];
    for (const field of fields) {
      const value = order.get(field);
      if (!value) continue;
      if (value.startsWith(REFERENCE_PREFIX)) {
        const { legacy } = JSON.parse(value.slice(REFERENCE_PREFIX.length));
        if (legacy) migratedAssets.set(`${legacy.resourceType}:${legacy.publicId}`, { legacy, reference: value });
        continue;
      }

      let asset;
      try { asset = legacyAsset(value); } catch { /* Unexpected legacy value */ }
      if (!asset) {
        invalidCount++;
        continue;
      }
      legacyCount++;
      if (mode !== "--copy") continue;
      const publicId = `emi-documents/migrated-${createHash("sha256").update(asset.url).digest("hex")}`;
      const assetId = asset.resourceType === "raw" ? `${publicId}.${asset.format}` : publicId;
      const key = `${asset.resourceType}:${asset.publicId}`;
      let reference = migratedAssets.get(key)?.reference;
      if (!reference) {
        let privateAsset = await cloudinary.uploader.upload(asset.url, {
          public_id: assetId,
          resource_type: asset.resourceType,
          type: "authenticated",
          overwrite: false,
        });
        if (!privateAsset?.public_id) {
          privateAsset = await cloudinary.api.resource(assetId, { resource_type: asset.resourceType, type: "authenticated" });
        }
        const legacy = { publicId: asset.publicId, resourceType: asset.resourceType };
        reference = encodeAsset(privateAsset, legacy);
        migratedAssets.set(key, { legacy, reference });
      }
      const update = await Order.updateOne({ _id: order._id, [field]: value }, { $set: { [field]: reference } });
      if (update.modifiedCount) copied++;
    }
  }

  console.log({ legacyReferences: legacyCount, unrecognizedReferences: invalidCount, copied, migratedAssets: migratedAssets.size });
  if (mode !== "--revoke-legacy") return;
  if (legacyCount || invalidCount) throw new Error("Resolve remaining legacy references before revoking public assets.");

  for (const { reference } of migratedAssets.values()) {
    const source = documentSource(reference);
    const response = await fetch(source.url, { method: "HEAD", redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("A private copy could not be verified.");
  }
  for (const { legacy } of migratedAssets.values()) {
    const result = await cloudinary.uploader.destroy(legacy.publicId, {
      resource_type: legacy.resourceType, type: "upload", invalidate: true,
    });
    if (!["ok", "not found"].includes(result.result)) throw new Error("A public asset could not be revoked.");
  }
  console.log(`Verified private copies and requested public-asset invalidation for ${migratedAssets.size} assets.`);
}

main().catch((error) => {
  console.error("EMI migration stopped", error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
