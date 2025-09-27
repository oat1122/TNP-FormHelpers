import { format } from "date-fns";
import { useState, useEffect, useCallback, useRef } from "react";

import { maxSupplyApi } from "../services/maxSupplyApi";

export const useMaxSupplyData = (filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    by_production_type: {
      screen: 0,
      dtf: 0,
      sublimation: 0,
      embroidery: 0,
    },
    work_calculations: {
      job_count: {
        screen: 0,
        dtf: 0,
        sublimation: 0,
        embroidery: 0,
      },
      current_workload: {
        screen: 0,
        dtf: 0,
        sublimation: 0,
        embroidery: 0,
      },
      capacity: {
        daily: { dtf: 2500, screen: 3000, sublimation: 500, embroidery: 400 },
        weekly: { dtf: 17500, screen: 21000, sublimation: 3500, embroidery: 2800 },
        monthly: { dtf: 75000, screen: 90000, sublimation: 15000, embroidery: 12000 },
      },
      utilization: {
        screen: 0,
        dtf: 0,
        sublimation: 0,
        embroidery: 0,
      },
      remaining_capacity: {
        daily: { dtf: 2500, screen: 3000, sublimation: 500, embroidery: 400 },
        weekly: { dtf: 17500, screen: 21000, sublimation: 3500, embroidery: 2800 },
        monthly: { dtf: 75000, screen: 90000, sublimation: 15000, embroidery: 12000 },
      },
    },
  });

  // Refs to prevent multiple concurrent requests
  const abortControllerRef = useRef(null);
  const isLoadingRef = useRef(false);
  const lastRequestTimeRef = useRef(0);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      // Prevent concurrent requests
      if (isLoadingRef.current && !forceRefresh) {
        if (process.env.NODE_ENV === "development") {
        }
        return;
      }

      // Debounce requests (minimum 1 second between requests)
      const now = Date.now();
      if (!forceRefresh && now - lastRequestTimeRef.current < 1000) {
        if (process.env.NODE_ENV === "development") {
        }
        return;
      }

      try {
        // Cancel previous request if exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        isLoadingRef.current = true;
        setLoading(true);
        setError(null);
        lastRequestTimeRef.current = now;

        // Prepare API parameters
        const params = {
          ...filters,
          date: filters.date ? format(filters.date, "yyyy-MM-dd") : undefined,
        };

        if (process.env.NODE_ENV === "development") {
        }

        const response = await maxSupplyApi.getAll(params);

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          if (process.env.NODE_ENV === "development") {
          }
          return;
        }

        if (process.env.NODE_ENV === "development") {
        }

        if (response.status === "success" || response.data) {
          const items = response.data || response.max_supplies || [];
          const normalizedData = Array.isArray(items) ? items : [];

          // Debug logging for work_calculations data - development only
          if (process.env.NODE_ENV === "development") {
            normalizedData.forEach((item, index) => {
              if (item.work_calculations) {
              } else {
              }
            });

            // Log summary of work_calculations found
            const itemsWithWorkCalc = normalizedData.filter((item) => item.work_calculations);
          }

          setData(normalizedData);

          // Calculate statistics
          const stats = calculateStatistics(normalizedData);
          setStatistics(stats);

          if (process.env.NODE_ENV === "development") {
          }
        } else {
          throw new Error(response.message || "Failed to load data");
        }
      } catch (err) {
        // Don't set error if request was aborted
        if (err.name === "AbortError" || abortControllerRef.current?.signal.aborted) {
          if (process.env.NODE_ENV === "development") {
          }
          return;
        }

        console.error("Error loading MaxSupply data:", err);

        // More user-friendly error messages
        let errorMessage = "Failed to load data";
        if (err.message.includes("timeout") || err.code === "ECONNABORTED") {
          errorMessage =
            "Request timed out after 30 seconds. Server may be overloaded or network is slow.";
        } else if (err.message.includes("Network Error") || err.code === "ERR_NETWORK") {
          errorMessage =
            "Cannot connect to server. Please check if the backend is running on localhost:8000.";
        } else if (err.message.includes("ERR_INSUFFICIENT_RESOURCES")) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (err.response?.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (err.response?.status === 404) {
          errorMessage = "API endpoint not found. Please check backend configuration.";
        } else if (err.response?.status === 500) {
          errorMessage = "Server error occurred. Please try again later.";
        }

        // Add detailed error info for debugging
        if (process.env.NODE_ENV === "development") {
          console.error("Full error details:", {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            response: err.response?.data,
          });
        }

        setError(errorMessage);

        // Set fallback data to prevent broken UI
        setData([]);
        setStatistics({
          total: 0,
          pending: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          by_production_type: {
            screen: 0,
            dtf: 0,
            sublimation: 0,
            embroidery: 0,
          },
          work_calculations: {
            job_count: {
              screen: 0,
              dtf: 0,
              sublimation: 0,
              embroidery: 0,
            },
            current_workload: {
              screen: 0,
              dtf: 0,
              sublimation: 0,
              embroidery: 0,
            },
            capacity: {
              daily: { dtf: 2500, screen: 3000, sublimation: 500, embroidery: 400 },
              weekly: { dtf: 17500, screen: 21000, sublimation: 3500, embroidery: 2800 },
              monthly: { dtf: 75000, screen: 90000, sublimation: 15000, embroidery: 12000 },
            },
            utilization: {
              screen: 0,
              dtf: 0,
              sublimation: 0,
              embroidery: 0,
            },
            remaining_capacity: {
              daily: { dtf: 2500, screen: 3000, sublimation: 500, embroidery: 400 },
              weekly: { dtf: 17500, screen: 21000, sublimation: 3500, embroidery: 2800 },
              monthly: { dtf: 75000, screen: 90000, sublimation: 15000, embroidery: 12000 },
            },
          },
        });
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [filters]
  );

  // Production capacities per day
  const PRODUCTION_CAPACITIES = {
    dtf: 2500,
    screen: 3000,
    sublimation: 500,
    embroidery: 400,
  };

  const calculateStatistics = (items) => {
    const stats = {
      total: items.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      by_production_type: {
        screen: 0,
        dtf: 0,
        sublimation: 0,
        embroidery: 0,
      },
      work_calculations: {
        job_count: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
        current_workload: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
        capacity: {
          daily: { ...PRODUCTION_CAPACITIES },
          weekly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 7;
            return acc;
          }, {}),
          monthly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 30;
            return acc;
          }, {}),
        },
        utilization: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
        remaining_capacity: {
          daily: { ...PRODUCTION_CAPACITIES },
          weekly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 7;
            return acc;
          }, {}),
          monthly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 30;
            return acc;
          }, {}),
        },
      },
    };

    items.forEach((item) => {
      // Count by status
      if (item.status) {
        stats[item.status] = (stats[item.status] || 0) + 1;
      }

      // Count by production type (legacy way)
      if (item.production_type && stats.by_production_type.hasOwnProperty(item.production_type)) {
        stats.by_production_type[item.production_type]++;
      }

      // Calculate job count and current workload from work_calculations
      // Only count jobs that are in progress
      if (item.work_calculations && item.status === "in_progress") {
        try {
          let workCalc = item.work_calculations;

          // Parse if it's a string
          if (typeof workCalc === "string") {
            workCalc = JSON.parse(workCalc);
          }

          // Count jobs and sum up workload for each production type
          Object.keys(workCalc).forEach((type) => {
            if (stats.work_calculations.current_workload[type] !== undefined) {
              const typeData = workCalc[type];
              const totalWork = typeData.total_work || 0;

              // Count jobs: increment job count for each production type that has work
              if (totalWork > 0) {
                stats.work_calculations.job_count[type]++;
              }

              // Sum up workload
              stats.work_calculations.current_workload[type] += totalWork;
            }
          });
        } catch (error) {
          console.error("Error parsing work_calculations for item:", item.id, error);
        }
      }
    });

    // Calculate utilization percentages and remaining capacity
    Object.keys(stats.work_calculations.current_workload).forEach((type) => {
      const currentWorkload = stats.work_calculations.current_workload[type];
      const dailyCapacity = stats.work_calculations.capacity.daily[type];
      const weeklyCapacity = stats.work_calculations.capacity.weekly[type];
      const monthlyCapacity = stats.work_calculations.capacity.monthly[type];

      if (dailyCapacity > 0) {
        // Calculate utilization percentage based on daily capacity
        const utilizationPercentage = Math.round((currentWorkload / dailyCapacity) * 100);
        stats.work_calculations.utilization[type] = utilizationPercentage;

        // Calculate remaining capacity
        stats.work_calculations.remaining_capacity.daily[type] = Math.max(
          0,
          dailyCapacity - currentWorkload
        );
        stats.work_calculations.remaining_capacity.weekly[type] = Math.max(
          0,
          weeklyCapacity - currentWorkload
        );
        stats.work_calculations.remaining_capacity.monthly[type] = Math.max(
          0,
          monthlyCapacity - currentWorkload
        );

        // Enhanced logging for capacity calculations - development only
        if (process.env.NODE_ENV === "development") {
          // Development logs removed for production
        }
      }
    });

    return stats;
  };

  const refetch = useCallback(() => {
    loadData(true); // Force refresh
  }, [loadData]);

  const getEventsForDate = useCallback(
    (date) => {
      return data.filter((event) => {
        if (!event.start_date) return false;

        const eventStart = new Date(event.start_date);
        const eventEnd = event.expected_completion_date
          ? new Date(event.expected_completion_date)
          : eventStart;

        // Reset time to compare only dates
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(0, 0, 0, 0);

        return targetDate >= eventStart && targetDate <= eventEnd;
      });
    },
    [data]
  );

  const getUpcomingDeadlines = useCallback(
    (days = 7) => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);

      return data
        .filter((item) => {
          // Use expected_completion_date instead of due_date
          if (!item.expected_completion_date) return false;
          const expectedDate = new Date(item.expected_completion_date);
          return expectedDate >= now && expectedDate <= futureDate;
        })
        .sort(
          (a, b) => new Date(a.expected_completion_date) - new Date(b.expected_completion_date)
        );
    },
    [data]
  );

  // Initial load only - prevent infinite loop
  useEffect(() => {
    let mounted = true;

    const initialLoad = async () => {
      if (mounted) {
        await loadData(true);
      }
    };

    initialLoad();

    return () => {
      mounted = false;
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array for initial load only

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Test function to verify calculations with example data
  const testCalculationLogic = () => {
    const exampleData = [
      {
        id: 1,
        status: "in_progress",
        production_type: "screen",
        work_calculations: {
          screen: {
            points: 1,
            total_quantity: 60,
            total_work: 60,
            description:
              "Screen Printing 1 จุด เสื้อทั้งหมด 60 ตัว (1×60=60) งาน Screen Printing มีงาน 60",
          },
          dtf: {
            points: 2,
            total_quantity: 60,
            total_work: 120,
            description:
              "DTF (Direct Film Transfer) 2 จุด เสื้อทั้งหมด 60 ตัว (2×60=120) งาน DTF มีงาน 120",
          },
        },
      },
    ];

    const result = calculateStatistics(exampleData);

    return result;
  };

  return {
    data,
    loading,
    error,
    statistics,
    refetch,
    getEventsForDate,
    getUpcomingDeadlines,
  };
};

// Test function to verify calculations with example data (exported separately)
export const testCalculationLogic = () => {
  // Production capacities per day
  const PRODUCTION_CAPACITIES = {
    dtf: 2500,
    screen: 3000,
    sublimation: 500,
    embroidery: 400,
  };

  const calculateStatistics = (items) => {
    const stats = {
      total: items.length,
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      by_production_type: {
        screen: 0,
        dtf: 0,
        sublimation: 0,
        embroidery: 0,
      },
      work_calculations: {
        job_count: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
        current_workload: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
        capacity: {
          daily: { ...PRODUCTION_CAPACITIES },
          weekly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 7;
            return acc;
          }, {}),
          monthly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 30;
            return acc;
          }, {}),
        },
        utilization: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
        remaining_capacity: {
          daily: { ...PRODUCTION_CAPACITIES },
          weekly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 7;
            return acc;
          }, {}),
          monthly: Object.keys(PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = PRODUCTION_CAPACITIES[key] * 30;
            return acc;
          }, {}),
        },
      },
    };

    items.forEach((item) => {
      // Calculate job count and current workload from work_calculations
      // Only count jobs that are in progress
      if (item.work_calculations && item.status === "in_progress") {
        try {
          let workCalc = item.work_calculations;

          // Parse if it's a string
          if (typeof workCalc === "string") {
            workCalc = JSON.parse(workCalc);
          }

          // Count jobs and sum up workload for each production type
          Object.keys(workCalc).forEach((type) => {
            if (stats.work_calculations.current_workload[type] !== undefined) {
              const typeData = workCalc[type];
              const totalWork = typeData.total_work || 0;

              // Count jobs: increment job count for each production type that has work
              if (totalWork > 0) {
                stats.work_calculations.job_count[type]++;
              }

              // Sum up workload
              stats.work_calculations.current_workload[type] += totalWork;
            }
          });
        } catch (error) {
          console.error("Error parsing work_calculations for item:", item.id, error);
        }
      }
    });

    // Calculate utilization percentages and remaining capacity
    Object.keys(stats.work_calculations.current_workload).forEach((type) => {
      const currentWorkload = stats.work_calculations.current_workload[type];
      const dailyCapacity = stats.work_calculations.capacity.daily[type];
      const weeklyCapacity = stats.work_calculations.capacity.weekly[type];
      const monthlyCapacity = stats.work_calculations.capacity.monthly[type];

      if (dailyCapacity > 0) {
        const utilizationPercentage = Math.round((currentWorkload / dailyCapacity) * 100);
        stats.work_calculations.utilization[type] = utilizationPercentage;

        stats.work_calculations.remaining_capacity.daily[type] = Math.max(
          0,
          dailyCapacity - currentWorkload
        );
        stats.work_calculations.remaining_capacity.weekly[type] = Math.max(
          0,
          weeklyCapacity - currentWorkload
        );
        stats.work_calculations.remaining_capacity.monthly[type] = Math.max(
          0,
          monthlyCapacity - currentWorkload
        );
      }
    });

    return stats;
  };

  const exampleData = [
    {
      id: 1,
      status: "in_progress",
      production_type: "screen",
      work_calculations: {
        screen: {
          points: 1,
          total_quantity: 60,
          total_work: 60,
          description:
            "Screen Printing 1 จุด เสื้อทั้งหมด 60 ตัว (1×60=60) งาน Screen Printing มีงาน 60",
        },
        dtf: {
          points: 2,
          total_quantity: 60,
          total_work: 120,
          description:
            "DTF (Direct Film Transfer) 2 จุด เสื้อทั้งหมด 60 ตัว (2×60=120) งาน DTF มีงาน 120",
        },
      },
    },
  ];

  const result = calculateStatistics(exampleData);

  return result;
};
