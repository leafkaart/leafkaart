const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

function validateUpload(file, allowedTypes, label) {
  if (!file || Array.isArray(file)) {
    throw Object.assign(new Error(`Upload one file for ${label}`), { status: 400 });
  }
  if (file.truncated || file.size > MAX_FILE_SIZE) {
    throw Object.assign(new Error(`${label} exceeds the 10 MB file limit`), { status: 413 });
  }
  if (!allowedTypes.includes(file.mimetype)) {
    throw Object.assign(new Error(`${label} has an unsupported file format`), { status: 415 });
  }
}

module.exports = { MAX_FILE_SIZE, IMAGE_TYPES, DOCUMENT_TYPES, validateUpload };
