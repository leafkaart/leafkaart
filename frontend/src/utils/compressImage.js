const DEFAULT_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.75,
};

// Dealer registration allows up to 5 photos and the combined upload must
// stay under this, so each photo is compressed toward a fifth of it.
export const MAX_TOTAL_PHOTOS_SIZE = 10 * 1024 * 1024;
const MAX_SINGLE_PHOTO_TARGET = MAX_TOTAL_PHOTOS_SIZE / 5;
const QUALITY_STEPS = [0.75, 0.6, 0.45, 0.3];

const drawToBlob = (img, maxWidth, maxHeight, quality) =>
  new Promise((resolve) => {
    let { width, height } = img;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });

/**
 * Resizes and re-encodes an image file as JPEG via canvas so large
 * camera photos don't blow past the server's upload size limit.
 * Steps quality down until the file is under ~2MB (a fifth of the
 * 10MB combined budget for 5 photos), falling back to the original
 * file if compression fails or doesn't help.
 */
export const compressImage = (file, options = {}) => {
  const { maxWidth, maxHeight } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      let bestBlob = null;
      for (const quality of QUALITY_STEPS) {
        const blob = await drawToBlob(img, maxWidth, maxHeight, quality);
        if (!blob) continue;
        bestBlob = blob;
        if (blob.size <= MAX_SINGLE_PHOTO_TARGET) break;
      }

      if (!bestBlob || bestBlob.size >= file.size) {
        resolve(file);
        return;
      }

      resolve(
        new File(
          [bestBlob],
          file.name.replace(/\.[^/.]+$/, "") + ".jpg",
          { type: "image/jpeg", lastModified: Date.now() }
        )
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

export const compressImages = (files, options = {}) =>
  Promise.all(files.map((file) => compressImage(file, options)));
