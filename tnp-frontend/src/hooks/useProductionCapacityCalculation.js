import { useState, useCallback, useMemo } from 'react';
import { 
  startOfDay, 
  endOfDay, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  startOfMonth, 
  endOfMonth, 
  addMonths 
} from 'date-fns';

export const useProductionCapacityCalculation = (allItems = [], externalSelectedTimePeriod = null) => {
  const [internalSelectedTimePeriod, setInternalSelectedTimePeriod] = useState('today');
  
  // Use external state if provided, otherwise use internal state
  const selectedTimePeriod = externalSelectedTimePeriod || internalSelectedTimePeriod;

  // Production capacities per day (base capacity)
  const BASE_PRODUCTION_CAPACITIES = {
    dtf: 2500,
    screen: 3000,
    sublimation: 500,
    embroidery: 400,
  };

  // Get date range for selected time period
  const getDateRange = useCallback((period) => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now),
          days: 1,
        };
      case 'tomorrow':
        const tomorrow = addDays(now, 1);
        return {
          start: startOfDay(tomorrow),
          end: endOfDay(tomorrow),
          days: 1,
        };
      case 'thisWeek':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
          end: endOfWeek(now, { weekStartsOn: 1 }),
          days: 7,
        };
      case 'nextWeek':
        const nextWeek = addWeeks(now, 1);
        return {
          start: startOfWeek(nextWeek, { weekStartsOn: 1 }),
          end: endOfWeek(nextWeek, { weekStartsOn: 1 }),
          days: 7,
        };
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          days: 30, // Approximate
        };
      case 'nextMonth':
        const nextMonth = addMonths(now, 1);
        return {
          start: startOfMonth(nextMonth),
          end: endOfMonth(nextMonth),
          days: 30, // Approximate
        };
      case 'thisQuarter':
        // Manual calculation for quarter
        const currentMonth = now.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
        const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
        return {
          start: startOfDay(quarterStart),
          end: endOfDay(quarterEnd),
          days: 90, // Approximate
        };
      default:
        return {
          start: startOfDay(now),
          end: endOfDay(now),
          days: 1,
        };
    }
  }, []);

  // Filter items based on selected time period
  const getFilteredItems = useCallback((items, period) => {
    const dateRange = getDateRange(period);
    
    // Filter items based on status and date range
    const filtered = items.filter(item => {
      // Include items with 'in_progress', 'in-progress', 'working', 'started', or 'active' status
      const validStatuses = ['in_progress', 'in-progress', 'working', 'started', 'active', 'pending'];
      const statusMatch = validStatuses.includes(item.status?.toLowerCase());
      
      if (!statusMatch) {
        return false;
      }

      // For in-progress items, use a more flexible date filtering:
      // - If start_date exists, check if the work period intersects with selected period
      // - If no dates, include all in-progress items (they're currently active)
      if (item.start_date) {
        const startDate = new Date(item.start_date);
        
        // For in-progress items, check if they started before or during the selected period
        // OR if they're expected to be worked on during the selected period
        let includeItem = false;
        
        if (item.expected_completion_date) {
          const endDate = new Date(item.expected_completion_date);
          
          // Include if:
          // 1. Work started before/during period AND not completed yet (status = in_progress)
          // 2. OR work period overlaps with selected period
          includeItem = (
            (startDate <= dateRange.end) || // Started before/during period
            (startDate <= dateRange.end && endDate >= dateRange.start) // Period overlap
          );
        } else {
          // No completion date - include if started before/during period
          includeItem = startDate <= dateRange.end;
        }
        
        return includeItem;
      }
      
      // If no date info, include all items with valid status (they're currently active)
      return true;
    });
    
    return filtered;
  }, [getDateRange]);

  // Calculate production capacity for selected time period
  const calculateProductionCapacity = useCallback((items, period) => {
    const filteredItems = getFilteredItems(items, period);
    const dateRange = getDateRange(period);
    
    const stats = {
      period,
      dateRange,
      total_items: filteredItems.length,
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
          total: Object.keys(BASE_PRODUCTION_CAPACITIES).reduce((acc, key) => {
            acc[key] = BASE_PRODUCTION_CAPACITIES[key] * dateRange.days;
            return acc;
          }, {}),
          daily: { ...BASE_PRODUCTION_CAPACITIES },
          period_days: dateRange.days,
        },
        utilization: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
        remaining_capacity: {
          screen: 0,
          dtf: 0,
          sublimation: 0,
          embroidery: 0,
        },
      }
    };

    // Calculate workload from filtered items
    filteredItems.forEach(item => {
      if (item.work_calculations) {
        try {
          let workCalc = item.work_calculations;
          
          // Parse if it's a string
          if (typeof workCalc === 'string') {
            workCalc = JSON.parse(workCalc);
          }

          // Count jobs and sum up workload for each production type
          Object.keys(workCalc).forEach(type => {
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
          console.error('❌ Error parsing work_calculations for item:', item.id, error);
        }
      }
    });

    // Calculate utilization percentages and remaining capacity
    Object.keys(stats.work_calculations.current_workload).forEach(type => {
      const currentWorkload = stats.work_calculations.current_workload[type];
      const totalCapacity = stats.work_calculations.capacity.total[type];
      
      if (totalCapacity > 0) {
        // Calculate utilization percentage based on period capacity (allow over 100%)
        const utilizationPercentage = Math.round((currentWorkload / totalCapacity) * 100);
        stats.work_calculations.utilization[type] = utilizationPercentage;
        
        // Calculate remaining capacity (can be negative for over-capacity)
        stats.work_calculations.remaining_capacity[type] = totalCapacity - currentWorkload;
      }
    });

    return stats;
  }, [getFilteredItems, getDateRange]);

  // Memoized calculation result
  const calculationResult = useMemo(() => {
    return calculateProductionCapacity(allItems, selectedTimePeriod);
  }, [allItems, selectedTimePeriod, calculateProductionCapacity]);

  // Get capacity display labels
  const getCapacityDisplayLabel = useCallback((period) => {
    const labels = {
      today: 'วันนี้',
      tomorrow: 'พรุ่งนี้',
      thisWeek: 'อาทิตนี้',
      nextWeek: 'อาทิตหน้า',
      thisMonth: 'เดือนนี้',
      nextMonth: 'เดือนหน้า',
      thisQuarter: 'ไตรมาสนี้',
    };
    return labels[period] || period;
  }, []);

  return {
    selectedTimePeriod,
    setSelectedTimePeriod: setInternalSelectedTimePeriod,
    calculationResult,
    getCapacityDisplayLabel,
    getDateRange,
    getFilteredItems,
    calculateProductionCapacity,
  };
};

export default useProductionCapacityCalculation; 