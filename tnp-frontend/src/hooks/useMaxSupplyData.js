import { useState, useEffect, useCallback, useRef } from 'react';
import { maxSupplyApi } from '../services/maxSupplyApi';
import { format } from 'date-fns';

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
    }
  });

  // Refs to prevent multiple concurrent requests
  const abortControllerRef = useRef(null);
  const isLoadingRef = useRef(false);
  const lastRequestTimeRef = useRef(0);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent requests
    if (isLoadingRef.current && !forceRefresh) {
      console.log('Request already in progress, skipping...');
      return;
    }

    // Debounce requests (minimum 1 second between requests)
    const now = Date.now();
    if (!forceRefresh && now - lastRequestTimeRef.current < 1000) {
      console.log('Request too soon, debouncing...');
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
        date: filters.date ? format(filters.date, 'yyyy-MM-dd') : undefined,
      };

      console.log('Loading MaxSupply data with params:', params);

      const response = await maxSupplyApi.getAll(params);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Request was aborted');
        return;
      }

      console.log('MaxSupply API response:', response);

      if (response.status === 'success' || response.data) {
        const items = response.data || response.max_supplies || [];
        const normalizedData = Array.isArray(items) ? items : [];
        
        setData(normalizedData);

        // Calculate statistics
        const stats = calculateStatistics(normalizedData);
        setStatistics(stats);
        
        console.log('Loaded data:', normalizedData);
        console.log('Calculated statistics:', stats);
      } else {
        throw new Error(response.message || 'Failed to load data');
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        console.log('Request aborted');
        return;
      }

      console.error('Error loading MaxSupply data:', err);
      
      // More user-friendly error messages
      let errorMessage = 'Failed to load data';
      if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check if the server is running.';
      } else if (err.message.includes('Network Error') || err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check if the backend is running on localhost:8000.';
      } else if (err.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check backend configuration.';
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
        }
      });
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [filters]);

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
      }
    };

    items.forEach(item => {
      // Count by status
      if (item.status) {
        stats[item.status] = (stats[item.status] || 0) + 1;
      }

      // Count by production type
      if (item.production_type && stats.by_production_type.hasOwnProperty(item.production_type)) {
        stats.by_production_type[item.production_type]++;
      }
    });

    return stats;
  };

  const refetch = useCallback(() => {
    loadData(true); // Force refresh
  }, [loadData]);

  const getEventsForDate = useCallback((date) => {
    return data.filter(event => {
      if (!event.start_date) return false;
      
      const eventStart = new Date(event.start_date);
      const eventEnd = event.expected_completion_date ? 
        new Date(event.expected_completion_date) : eventStart;
      
      // Reset time to compare only dates
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      
      return targetDate >= eventStart && targetDate <= eventEnd;
    });
  }, [data]);

  const getUpcomingDeadlines = useCallback((days = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return data
      .filter(item => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate >= now && dueDate <= futureDate;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [data]);

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