import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook สำหรับ debounced value
 * ใช้สำหรับ optimize การค้นหาและ filter
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook สำหรับ intersection observer
 * ใช้สำหรับ infinite scrolling optimization
 */
export const useIntersectionObserver = (callback, options = {}) => {
  const [targetRef, setTargetRef] = useState(null);
  const observerRef = useRef();

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!targetRef) return;

    disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback(entry);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observerRef.current.observe(targetRef);

    return disconnect;
  }, [targetRef, callback, options, disconnect]);

  return { setTargetRef, disconnect };
};

/**
 * Custom hook สำหรับ performance monitoring
 * ใช้สำหรับวัดประสิทธิภาพของ component
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
 * Custom hook สำหรับ optimized local storage
 * ใช้สำหรับ cache data locally
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
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Custom hook สำหรับ API cache management
 * ใช้สำหรับจัดการ cache ของ API responses
 */
export const useApiCache = (cacheKey, ttl = 300000) => {
  // 5 minutes default
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`api_cache_${cacheKey}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > ttl) {
        localStorage.removeItem(`api_cache_${cacheKey}`);
        return null;
      }

      return data;
    } catch (error) {
      console.warn("Error reading API cache:", error);
      return null;
    }
  }, [cacheKey, ttl]);

  const setCachedData = useCallback(
    (data) => {
      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          `api_cache_${cacheKey}`,
          JSON.stringify(cacheData)
        );
      } catch (error) {
        console.warn("Error setting API cache:", error);
      }
    },
    [cacheKey]
  );

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(`api_cache_${cacheKey}`);
    } catch (error) {
      console.warn("Error clearing API cache:", error);
    }
  }, [cacheKey]);

  return { getCachedData, setCachedData, clearCache };
};
