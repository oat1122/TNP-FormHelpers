/**
 * Accounting Performance Optimization Hooks
 * ปรับปรุงประสิทธิภาพการโหลดของระบบ Accounting
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// Custom debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  };
};

// Custom throttle function
const throttle = (func, limit) => {
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
 * Hook สำหรับ performance monitoring
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;

    if (process.env.NODE_ENV === "development") {
      const renderTime = performance.now() - startTimeRef.current;

      console.log(`[Performance] ${componentName}:`, {
        renderCount: renderCountRef.current,
        renderTime: `${renderTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    startTimeRef.current = performance.now();
  });

  const logCustomMetric = useCallback(
    (metricName, value) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Performance] ${componentName} - ${metricName}:`, value);
      }
    },
    [componentName]
  );

  return { logCustomMetric };
};

/**
 * Hook สำหรับ optimized local storage
 */
export const useOptimizedLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
};

/**
 * Hook สำหรับ debounced search
 */
export const useDebounceSearch = (initialValue = "", delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  const debouncedUpdate = useMemo(
    () =>
      debounce((value) => {
        setDebouncedSearchTerm(value);
      }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedUpdate(searchTerm);
    return () => {
      debouncedUpdate.cancel();
    };
  }, [searchTerm, debouncedUpdate]);

  return [searchTerm, setSearchTerm, debouncedSearchTerm];
};

/**
 * Hook สำหรับ optimized pagination
 */
export const useOptimizedPagination = (data = [], itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [cachedPages, setCachedPages] = useState(new Map());

  // Memoized pagination calculations
  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [data.length, itemsPerPage, currentPage]);

  // Memoized current page data
  const currentPageData = useMemo(() => {
    const cacheKey = `${currentPage}-${itemsPerPage}`;

    if (cachedPages.has(cacheKey)) {
      return cachedPages.get(cacheKey);
    }

    const pageData = data.slice(paginationInfo.startIndex, paginationInfo.endIndex);

    // Cache the page data
    setCachedPages((prev) => {
      const newCache = new Map(prev);
      newCache.set(cacheKey, pageData);

      // Keep only last 5 pages in cache
      if (newCache.size > 5) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }

      return newCache;
    });

    return pageData;
  }, [
    data,
    currentPage,
    itemsPerPage,
    paginationInfo.startIndex,
    paginationInfo.endIndex,
    cachedPages,
  ]);

  const goToPage = useCallback(
    (page) => {
      setCurrentPage(Math.max(1, Math.min(page, paginationInfo.totalPages)));
    },
    [paginationInfo.totalPages]
  );

  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const prevPage = useCallback(() => {
    if (paginationInfo.hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [paginationInfo.hasPrevPage]);

  // Clear cache when data changes significantly
  useEffect(() => {
    setCachedPages(new Map());
  }, [data.length]);

  return {
    currentPageData,
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    ...paginationInfo,
  };
};

/**
 * Hook สำหรับ virtual scrolling สำหรับ list ขนาดใหญ่
 */
export const useVirtualScroll = (items = [], itemHeight = 80, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef();

  const visibleItems = useMemo(() => {
    const containerItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + containerItemCount + 1, items.length);

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback(
    throttle((e) => {
      setScrollTop(e.target.scrollTop);
    }, 16), // 60fps
    []
  );

  return {
    ...visibleItems,
    scrollElementRef,
    handleScroll,
  };
};

/**
 * Hook สำหรับ optimized filtering
 */
export const useOptimizedFilter = (data = [], filterConfig = {}) => {
  const [filters, setFilters] = useState({});

  const filteredData = useMemo(() => {
    let result = [...data];

    Object.entries(filters).forEach(([key, value]) => {
      if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      const config = filterConfig[key];
      if (!config) return;

      switch (config.type) {
        case "text":
          result = result.filter((item) =>
            config.accessor(item)?.toLowerCase().includes(value.toLowerCase())
          );
          break;
        case "select":
          result = result.filter((item) => config.accessor(item) === value);
          break;
        case "date":
          result = result.filter((item) => {
            const itemDate = new Date(config.accessor(item));
            return itemDate >= value.start && itemDate <= value.end;
          });
          break;
        case "number":
          result = result.filter((item) => {
            const itemValue = config.accessor(item);
            return itemValue >= value.min && itemValue <= value.max;
          });
          break;
        default:
          break;
      }
    });

    return result;
  }, [data, filters, filterConfig]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const clearFilter = useCallback((key) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filteredData,
    filters,
    updateFilter,
    clearFilters,
    clearFilter,
  };
};

/**
 * Hook สำหรับ caching API responses
 */
export const useApiCache = (cacheKey, defaultValue = null, ttl = 5 * 60 * 1000) => {
  const [cachedData, setCachedData] = useState(() => {
    try {
      const cached = localStorage.getItem(`api_cache_${cacheKey}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data;
        }
      }
    } catch (error) {
      console.warn(`Error reading cache for ${cacheKey}:`, error);
    }
    return defaultValue;
  });

  const setCacheData = useCallback(
    (data) => {
      setCachedData(data);
      try {
        localStorage.setItem(
          `api_cache_${cacheKey}`,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.warn(`Error setting cache for ${cacheKey}:`, error);
      }
    },
    [cacheKey]
  );

  const clearCache = useCallback(() => {
    setCachedData(defaultValue);
    localStorage.removeItem(`api_cache_${cacheKey}`);
  }, [cacheKey, defaultValue]);

  return [cachedData, setCacheData, clearCache];
};

/**
 * Hook สำหรับ optimized component re-rendering
 */
export const useOptimizedRerender = (dependencies = []) => {
  const previousDeps = useRef();
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    const depsChanged =
      !previousDeps.current ||
      dependencies.some((dep, index) => dep !== previousDeps.current[index]);

    if (depsChanged) {
      previousDeps.current = dependencies;
      setRenderKey((prev) => prev + 1);
    }
  }, dependencies);

  return renderKey;
};
