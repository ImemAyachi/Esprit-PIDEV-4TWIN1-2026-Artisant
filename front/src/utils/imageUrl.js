/**
 * Utility to resolve product image URLs.
 * - If the URL is already absolute (http/https), returns as-is (e.g. Cloudinary)
 * - If the URL starts with /uploads, it's a local server upload — returns as-is
 *   because Vite proxy forwards /uploads → backend in dev mode.
 * - Returns null/empty string if no URL provided
 */
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const getImageUrl = (url) => {
  if (!url) return null;
  // Already absolute URL (Cloudinary, S3, etc.)
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Local upload path — return as-is so Vite proxy handles it in dev (avoids cross-origin block)
  if (url.startsWith('/uploads/')) return url;
  return url;
};

/**
 * Get the first image URL from a product's media array
 */
export const getProductImage = (product) => {
  if (!product) return null;
  // Prefer mainImage if set
  if (product.mainImage) return getImageUrl(product.mainImage);
  // Otherwise find first image in media array
  const firstImage = product.media?.find(m => m.type === 'image');
  return getImageUrl(firstImage?.url);
};
