/**
 * Performance utilities for Worksheet components
 */

/**
 * วัดเวลาการ execute function
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
 * Throttle function เพื่อจำกัดการเรียก function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep compare objects เพื่อ optimize re-renders
 */
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return false;

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
 * Batch array operations เพื่อ optimize การประมวลผล
 */
export const batchProcess = (array, batchSize = 100, processor) => {
  return new Promise((resolve) => {
    const results = [];
    let index = 0;

    const processBatch = () => {
      const batch = array.slice(index, index + batchSize);
      const batchResults = batch.map(processor);
      results.push(...batchResults);

      index += batchSize;

      if (index < array.length) {
        // ใช้ setTimeout เพื่อไม่ให้ block UI
        setTimeout(processBatch, 0);
      } else {
        resolve(results);
      }
    };

    processBatch();
  });
};

/**
 * Memory usage monitor
 */
export const getMemoryUsage = () => {
  if ("memory" in performance) {
    const memory = performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

/**
 * Image preloader สำหรับ optimize การโหลดรูป
 */
export const preloadImages = (imageUrls) => {
  return Promise.all(
    imageUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    })
  );
};

/**
 * Optimize array filtering with early return
 */
export const optimizedFilter = (array, filters) => {
  return array.filter((item) => {
    // เช็ค filters ที่เร็วที่สุดก่อน
    for (const [key, value] of Object.entries(filters)) {
      if (value !== "" && item[key] !== value) {
        return false; // Early return
      }
    }
    return true;
  });
};

/**
 * Optimized search function
 */
export const optimizedSearch = (array, searchTerm, searchFields) => {
  if (!searchTerm || searchTerm.length < 2) return array;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return array.filter((item) => {
    return searchFields.some((field) => {
      const fieldValue = item[field];
      return (
        fieldValue &&
        typeof fieldValue === "string" &&
        fieldValue.toLowerCase().includes(lowerSearchTerm)
      );
    });
  });
};

/**
 * Virtual scrolling calculation
 */
export const calculateVirtualScrolling = (
  scrollTop,
  itemHeight,
  containerHeight,
  totalItems,
  overscan = 5
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
    offsetY: startIndex * itemHeight,
  };
};

/**
 * Web Workers helper for heavy computations
 */
export const createWorker = (workerFunction) => {
  const workerScript = `
    self.onmessage = function(e) {
      const result = (${workerFunction.toString()})(e.data);
      self.postMessage(result);
    }
  `;

  const blob = new Blob([workerScript], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
};

/**
 * Performance budget checker
 */
export const checkPerformanceBudget = (metrics) => {
  const budgets = {
    renderTime: 16, // 60fps = 16ms per frame
    apiResponse: 1000, // 1 second
    memoryUsage: 50, // 50MB
  };

  const violations = [];

  Object.entries(budgets).forEach(([metric, budget]) => {
    if (metrics[metric] > budget) {
      violations.push({
        metric,
        value: metrics[metric],
        budget,
        exceeded: metrics[metric] - budget,
      });
    }
  });

  if (violations.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("[Performance Budget] Violations detected:", violations);
  }

  return violations;
};
