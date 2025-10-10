/**
 * Utility functions for file downloads
 */

/**
 * Force download a file from URL
 * @param {string} url - URL ของไฟล์
 * @param {string} filename - ชื่อไฟล์ที่ต้องการบันทึก
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download file using fetch (for better control)
 * @param {string} url - URL ของไฟล์
 * @param {string} filename - ชื่อไฟล์ที่ต้องการบันทึก
 */
export const downloadFileWithFetch = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'download';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback to simple link
    downloadFile(url, filename);
  }
};

/**
 * Open file in new tab
 * @param {string} url - URL ของไฟล์
 */
export const openFileInNewTab = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Normalize file path (convert backslashes to forward slashes)
 * @param {string} path - File path
 * @returns {string} Normalized path
 */
export const normalizePath = (path) => {
  if (!path) return '';
  return path.replace(/\\/g, '/');
};
