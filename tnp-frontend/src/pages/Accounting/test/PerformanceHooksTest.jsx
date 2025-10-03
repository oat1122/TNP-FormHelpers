import React from "react";

// Test component เพื่อตรวจสอบ performance hooks
const PerformanceHooksTest = () => {
  try {
    // ทดสอบ import hooks
    const {
      usePerformanceMonitor,
      useDebounceSearch,
      useOptimizedPagination,
      useOptimizedLocalStorage,
    } = require("../hooks/useAccountingOptimization");

    console.log("✅ Performance hooks imported successfully");

    // ทดสอบ import skeleton components
    const {
      DashboardStatsGridSkeleton,
      PricingRequestListSkeleton,
    } = require("../components/SkeletonLoaders");

    console.log("✅ Skeleton components imported successfully");

    // ทดสอบ import utils
    const { formatNumber, formatDate, throttle, debounce } = require("../utils/performanceUtils");

    console.log("✅ Performance utils imported successfully");

    return <div>All imports working correctly! ✅</div>;
  } catch (error) {
    console.error("❌ Import error:", error);
    return <div>Import error: {error.message}</div>;
  }
};

export default PerformanceHooksTest;
