const allowedImageExtensions = new Set(["png", "jpg", "jpeg", "webp"]);

export function required(value: string, fieldName: string) {
  if (!value.trim()) {
    return `${fieldName} is required.`;
  }

  return null;
}

export function isSupportedImagePath(path?: string | null) {
  if (!path) return true;
  if (path.startsWith("data:image/")) return true;
  if (/^https?:\/\/.+\.(png|jpe?g|webp)(\?.*)?$/i.test(path)) return true;
  const extension = path.split(".").pop()?.toLowerCase();
  return extension ? allowedImageExtensions.has(extension) : false;
}

export function validateImagePath(path?: string | null) {
  return isSupportedImagePath(path)
    ? null
    : "Image must be PNG, JPG, JPEG, or WEBP.";
}
