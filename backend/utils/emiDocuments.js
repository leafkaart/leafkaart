const cloudinary = require("cloudinary").v2;

const REFERENCE_PREFIX = "cloudinary:";
const CONTENT_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", pdf: "application/pdf" };

function encodeAsset(asset, legacy) {
  const format = asset.format || asset.public_id?.split(".").at(-1)?.toLowerCase();
  if (!asset.public_id || !CONTENT_TYPES[format] || !["image", "raw"].includes(asset.resource_type)) {
    throw new Error("Unexpected asset format");
  }
  return REFERENCE_PREFIX + JSON.stringify({
    publicId: asset.public_id,
    resourceType: asset.resource_type,
    format,
    ...(legacy && { legacy }),
  });
}

function legacyAsset(reference) {
  const url = new URL(reference);
  if (url.origin !== "https://res.cloudinary.com") return null;
  const [cloudName, resourceType, delivery, ...path] = url.pathname.slice(1).split("/");
  if (cloudName !== process.env.CLOUD_NAME || delivery !== "upload" || !["image", "raw"].includes(resourceType)) return null;
  if (/^v\d+$/.test(path[0])) path.shift();
  const name = path.map(decodeURIComponent).join("/");
  const format = name.split(".").at(-1)?.toLowerCase();
  if (!name || !CONTENT_TYPES[format]) return null;
  const publicId = resourceType === "raw" ? name : name.slice(0, -(format.length + 1));
  return { publicId, resourceType, format, url: url.href };
}

async function uploadEmiDocument(file, label) {
  try {
    const asset = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "emi-documents",
      resource_type: "auto",
      type: "authenticated",
    });
    return encodeAsset(asset);
  } catch (error) {
    console.error("EMI document upload failed", error);
    throw Object.assign(new Error(`Could not upload ${label}`), { status: 502 });
  }
}

function listEmiDocuments(order) {
  const documents = order.emiDocuments || {};
  return [
    { id: "aadhaar-front", name: "Aadhaar Front", reference: documents.aadhaarFront || order.addharfrontimage },
    { id: "aadhaar-back", name: "Aadhaar Back", reference: documents.aadhaarBack || order.aadharbackimage },
    { id: "pan", name: "PAN Card", reference: documents.panCard || order.pancardimage },
    { id: "payment", name: "Payment attachment", reference: order.paymentImage },
    ...(documents.otherDocuments || []).map((doc, index) => ({
      id: `supporting-${index}`, name: doc.name, reference: doc.url,
    })),
  ].filter((document) => document.reference);
}

function documentSource(reference) {
  if (reference.startsWith(REFERENCE_PREFIX)) {
    const { publicId, resourceType, format } = JSON.parse(reference.slice(REFERENCE_PREFIX.length));
    if (!CONTENT_TYPES[format] || !["image", "raw"].includes(resourceType)) return null;
    return {
      url: cloudinary.url(publicId, {
        secure: true,
        type: "authenticated",
        resource_type: resourceType,
        sign_url: true,
        ...(resourceType === "image" && { format }),
      }),
      contentType: CONTENT_TYPES[format],
    };
  }

  const asset = legacyAsset(reference);
  return asset && { url: asset.url, contentType: CONTENT_TYPES[asset.format] };
}

module.exports = { REFERENCE_PREFIX, encodeAsset, legacyAsset, uploadEmiDocument, listEmiDocuments, documentSource };
