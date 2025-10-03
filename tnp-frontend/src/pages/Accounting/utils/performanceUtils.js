/**
 * Performance utilities สำหรับ Accounting system
 */

/**
 * Measure execution time ของ function
 */
export const measureExecutionTime = (fn, label = "Function") => {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${label} execution time: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  };
};

/**
 * Throttle function สำหรับจำกัดการเรียก function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Debounce function สำหรับ delayed execution
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
};

/**
 * Deep compare objects เพื่อ optimize re-renders
 */
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;

  if (!obj1 || !obj2) return false;

  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

/**
 * Memoization utility
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();

  return (...args) => {
    const key = keyGenerator(...args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    // ให้ cache เก็บได้สูงสุด 50 items
    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
};

/**
 * Batch function calls เพื่อลด re-renders
 */
export const batchUpdates = (() => {
  let pending = [];
  let timeoutId = null;

  return (fn) => {
    pending.push(fn);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const updates = [...pending];
      pending = [];
      timeoutId = null;

      updates.forEach((update) => update());
    }, 0);
  };
})();

/**
 * Image lazy loading utility
 */
export const createImageLoader = (src, placeholder = null) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));

    img.src = src;
  });
};

/**
 * Format numbers ให้แสดงผลดี
 */
export const formatNumber = (num, options = {}) => {
  const { decimals = 2, separator = ",", currency = false, currencySymbol = "฿" } = options;

  if (isNaN(num)) return "0";

  const formatted = Number(num).toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return currency ? `${currencySymbol}${formatted}` : formatted;
};

/**
 * Date formatting utility
 */
export const formatDate = (date, format = "short") => {
  if (!date) return "";

  const d = new Date(date);

  const formats = {
    short: { day: "2-digit", month: "2-digit", year: "numeric" },
    long: {
      day: "2-digit",
      month: "long",
      year: "numeric",
      weekday: "long",
    },
    time: {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    datetime: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  };

  return d.toLocaleDateString("th-TH", formats[format] || formats.short);
};

/**
 * Storage utilities
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage:`, error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage:`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage:`, error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn(`Error clearing localStorage:`, error);
      return false;
    }
  },
};

/**
 * API response cache utility
 */
export const createApiCache = (ttl = 5 * 60 * 1000) => {
  const cache = new Map();

  return {
    get: (key) => {
      const item = cache.get(key);

      if (!item) return null;

      if (Date.now() - item.timestamp > ttl) {
        cache.delete(key);
        return null;
      }

      return item.data;
    },

    set: (key, data) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      // ให้ cache เก็บได้สูงสุด 100 items
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
    },

    delete: (key) => {
      cache.delete(key);
    },

    clear: () => {
      cache.clear();
    },

    size: () => cache.size,
  };
};

/**
 * Performance monitoring utility
 */
export const performanceMonitor = {
  startTime: null,

  start: (label = "Operation") => {
    performanceMonitor.startTime = performance.now();
    console.time(label);
  },

  end: (label = "Operation") => {
    if (performanceMonitor.startTime) {
      const duration = performance.now() - performanceMonitor.startTime;
      console.timeEnd(label);

      if (process.env.NODE_ENV === "development") {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      }

      performanceMonitor.startTime = null;
      return duration;
    }

    return 0;
  },

  measure: (fn, label = "Function") => {
    return measureExecutionTime(fn, label);
  },
};

/**
 * Error handling utility
 */
export const handleError = (error, context = "Unknown") => {
  console.error(`[Error in ${context}]:`, error);

  // Send to error reporting service in production
  if (process.env.NODE_ENV === "production") {
    // Example: Sentry.captureException(error, { tags: { context } });
  }

  return {
    message: error.message || "An error occurred",
    context,
    timestamp: new Date().toISOString(),
  };
};
