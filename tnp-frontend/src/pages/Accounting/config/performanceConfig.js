/**
 * Performance Configuration สำหรับ Accounting System
 */

export const PERFORMANCE_CONFIG = {
  // API Caching
  API_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  API_CACHE_MAX_SIZE: 100, // max 100 cached items

  // Debouncing
  SEARCH_DEBOUNCE_DELAY: 300, // 300ms
  FILTER_DEBOUNCE_DELAY: 500, // 500ms

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Local Storage
  LOCAL_STORAGE_PREFIX: "tnp_accounting_",
  LOCAL_STORAGE_TTL: 24 * 60 * 60 * 1000, // 24 hours

  // Performance Monitoring
  ENABLE_PERFORMANCE_LOGGING: process.env.NODE_ENV === "development",
  PERFORMANCE_THRESHOLD_MS: 100, // Log operations taking longer than 100ms

  // Virtual Scrolling
  VIRTUAL_SCROLL_ITEM_HEIGHT: 80,
  VIRTUAL_SCROLL_THRESHOLD: 50, // Enable virtual scrolling for lists > 50 items

  // Skeleton Loading
  SKELETON_ANIMATION_DURATION: 1500,
  SKELETON_DELAY: 200, // Show skeleton after 200ms of loading

  // Bundle Optimization
  LAZY_LOAD_THRESHOLD: 1000, // Lazy load components > 1KB
  PRELOAD_DELAY: 2000, // Preload next components after 2s

  // Memory Management
  MAX_CACHED_PAGES: 5,
  CLEANUP_INTERVAL: 10 * 60 * 1000, // Cleanup cache every 10 minutes
};

export const SKELETON_CONFIG = {
  STATS_CARD_COUNT: 4,
  ACTIVITY_LIST_COUNT: 5,
  PRICING_REQUEST_COUNT: 3,
  TABLE_ROW_COUNT: 10,
  TABLE_COLUMN_COUNT: 5,
  NOTIFICATION_COUNT: 3,
};

export const CACHE_KEYS = {
  DASHBOARD_STATS: "dashboard_stats",
  PRICING_REQUESTS: "pricing_requests",
  CUSTOMER_LIST: "customer_list",
  USER_PREFERENCES: "user_preferences",
  FILTER_SETTINGS: "filter_settings",
};

export const API_ENDPOINTS = {
  PRICING_REQUESTS: "/pricing-requests",
  DASHBOARD_STATS: "/dashboard/stats",
  QUOTATIONS: "/quotations",
  INVOICES: "/invoices",
  DELIVERY_NOTES: "/delivery-notes",
  RECEIPTS: "/receipts",
};

/**
 * Performance thresholds สำหรับ monitoring
 */
export const PERFORMANCE_THRESHOLDS = {
  // Component render times (ms)
  COMPONENT_RENDER: {
    GOOD: 16, // 60fps
    ACCEPTABLE: 33, // 30fps
    POOR: 100,
  },

  // API response times (ms)
  API_RESPONSE: {
    GOOD: 200,
    ACCEPTABLE: 500,
    POOR: 1000,
  },

  // User interaction response (ms)
  USER_INTERACTION: {
    GOOD: 100,
    ACCEPTABLE: 300,
    POOR: 1000,
  },

  // Memory usage (MB)
  MEMORY_USAGE: {
    GOOD: 50,
    ACCEPTABLE: 100,
    POOR: 200,
  },
};

/**
 * Error boundaries configuration
 */
export const ERROR_BOUNDARY_CONFIG = {
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === "production",
  FALLBACK_COMPONENT: "ErrorFallback",
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

/**
 * Bundle splitting configuration
 */
export const BUNDLE_CONFIG = {
  VENDOR_CHUNK_SIZE: 200, // KB
  COMPONENT_CHUNK_SIZE: 100, // KB
  ENABLE_TREE_SHAKING: true,
  ENABLE_CODE_SPLITTING: true,
};
