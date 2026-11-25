const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality, uploadOptions = {}) => {
  const options = { folder };
  if (height) {
    options.height = height;
  }
  if (quality) {
    options.quality = quality;
  }
  return cloudinary.uploader.upload(file.tempFilePath, { resource_type: "auto", ...options, ...uploadOptions });
};
