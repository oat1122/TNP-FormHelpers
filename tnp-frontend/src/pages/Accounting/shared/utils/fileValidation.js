/**
 * File upload validation utilities for Accounting module.
 *
 * Mirrors backend limits documented in `.claude/rules/file-upload.md` and is
 * the single client-side guard before any upload mutation.
 *
 * Server validates again — do NOT rely on these checks for security; they
 * exist for UX only (fail fast, friendly Thai error message, avoid wasted
 * upload bandwidth and BE round-trips).
 */

const BYTES_PER_MB = 1024 * 1024;

export const FILE_LIMITS = Object.freeze({
  IMAGE_MAX_BYTES: 5 * BYTES_PER_MB,
  PDF_MAX_BYTES: 10 * BYTES_PER_MB,
  TOTAL_REQUEST_MAX_BYTES: 20 * BYTES_PER_MB,
});

export const ALLOWED_IMAGE_MIMES = Object.freeze(["image/jpeg", "image/png", "image/webp"]);

export const ALLOWED_PDF_MIMES = Object.freeze(["application/pdf"]);

export const ALLOWED_EVIDENCE_MIMES = Object.freeze([...ALLOWED_IMAGE_MIMES, ...ALLOWED_PDF_MIMES]);

/**
 * Human-readable byte size for error messages (e.g. "5 MB", "512 KB").
 */
export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes >= BYTES_PER_MB) {
    const mb = bytes / BYTES_PER_MB;
    const rounded = Math.round(mb * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
};

const isImageMime = (mime) => ALLOWED_IMAGE_MIMES.includes(mime);
const isPdfMime = (mime) => ALLOWED_PDF_MIMES.includes(mime);

const resolveMaxBytes = (file, options) => {
  if (Number.isFinite(options?.maxBytes)) return options.maxBytes;
  if (isPdfMime(file.type)) return FILE_LIMITS.PDF_MAX_BYTES;
  return FILE_LIMITS.IMAGE_MAX_BYTES;
};

const buildAllowedLabel = (allowedMimes) => {
  const parts = [];
  if (allowedMimes.some(isImageMime)) parts.push("JPG, PNG, WEBP");
  if (allowedMimes.some(isPdfMime)) parts.push("PDF");
  return parts.join(", ");
};

/**
 * Validate a single File against allowed MIME list + size limit.
 *
 * @param {File} file
 * @param {{ allowedMimes?: string[], maxBytes?: number }} [options]
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateFile = (file, options = {}) => {
  if (!file) {
    return { valid: false, error: "ไม่พบไฟล์ที่ต้องการอัปโหลด" };
  }

  const allowedMimes = options.allowedMimes || ALLOWED_EVIDENCE_MIMES;
  const name = file.name || "ไม่ทราบชื่อไฟล์";

  if (!allowedMimes.includes(file.type)) {
    const allowedLabel = buildAllowedLabel(allowedMimes) || "JPG, PNG, WEBP, PDF";
    return {
      valid: false,
      error: `ชนิดไฟล์ ${name} ไม่รองรับ (รองรับเฉพาะ ${allowedLabel})`,
    };
  }

  const maxBytes = resolveMaxBytes(file, options);
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `ไฟล์ ${name} ขนาดเกิน ${formatBytes(maxBytes)}`,
    };
  }

  return { valid: true };
};

/**
 * Validate an array of File objects.
 *
 * Returns the subset that passes individual checks (`validFiles`) and a list
 * of error messages. Also enforces TOTAL_REQUEST_MAX_BYTES on the original
 * input so a batch of small-but-many files cannot bypass the BE limit.
 *
 * @param {File[]} files
 * @param {{ allowedMimes?: string[], maxBytes?: number, maxTotalBytes?: number }} [options]
 * @returns {{ valid: boolean, validFiles: File[], errors: string[] }}
 */
export const validateFiles = (files, options = {}) => {
  const list = Array.isArray(files) ? files : [];
  const errors = [];
  const validFiles = [];

  if (list.length === 0) {
    return { valid: false, validFiles, errors: ["ไม่พบไฟล์ที่ต้องการอัปโหลด"] };
  }

  list.forEach((file) => {
    const result = validateFile(file, options);
    if (result.valid) {
      validFiles.push(file);
    } else if (result.error) {
      errors.push(result.error);
    }
  });

  const maxTotalBytes = Number.isFinite(options.maxTotalBytes)
    ? options.maxTotalBytes
    : FILE_LIMITS.TOTAL_REQUEST_MAX_BYTES;
  const totalBytes = list.reduce((sum, file) => sum + (file?.size || 0), 0);
  if (totalBytes > maxTotalBytes) {
    errors.push(`ขนาดไฟล์รวมเกิน ${formatBytes(maxTotalBytes)} (รวม ${formatBytes(totalBytes)})`);
  }

  return {
    valid: errors.length === 0 && validFiles.length === list.length,
    validFiles,
    errors,
  };
};
