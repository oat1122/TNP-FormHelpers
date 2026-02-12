/**
 * Get backend origin URL
 * @returns {string} Backend origin URL
 */
export const getBackendOrigin = () => {
  try {
    const apiBase = import.meta.env.VITE_END_POINT_URL || "";
    return new URL(apiBase).origin;
  } catch {
    return "";
  }
};

/**
 * Get cover image URL for a product
 * @param {object} product - Product object
 * @returns {string|null} Cover image URL or null
 */
export const getCoverImageUrl = (product) => {
  if (product.sp_cover_image) {
    return `${getBackendOrigin()}/storage/${product.sp_cover_image}`;
  }
  const coverImg = product.images?.find((img) => img.spi_is_cover);
  if (coverImg) {
    return `${getBackendOrigin()}/storage/${coverImg.spi_file_path}`;
  }
  return null;
};

/**
 * Get image URL from file path
 * @param {string} filePath - File path
 * @returns {string} Full image URL
 */
export const getImageUrl = (filePath) => {
  if (!filePath) return "";
  return `${getBackendOrigin()}/storage/${filePath}`;
};
