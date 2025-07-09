import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create the context
const MaxSupplyContext = createContext();

// Custom hook for using the context
export const useMaxSupply = () => {
  return useContext(MaxSupplyContext);
};

// Provider component
export const MaxSupplyProvider = ({ children }) => {
  const [maxSupplies, setMaxSupplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [worksheetList, setWorksheetList] = useState([]);
  
  // Fetch all max supplies
  const fetchMaxSupplies = async (filters = {}) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/max-supplies?${queryParams}`);
      setMaxSupplies(response.data.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch max supplies');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch calendar data
  const fetchCalendarData = async (year, month) => {
    try {
      setIsLoading(true);
      let url = '/api/calendar';
      
      if (year && month) {
        url = `/api/calendar/${year}/${month}`;
      }
      
      const response = await axios.get(url);
      setCalendarData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch calendar data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch weekly calendar data
  const fetchWeekCalendarData = async (date) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/calendar/week/${date}`);
      setCalendarData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch weekly calendar data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/statistics/dashboard');
      setStatistics(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch worksheets (for auto-fill)
  const fetchWorksheetList = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/worksheets');
      setWorksheetList(response.data.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch worksheets');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get worksheet details by ID
  const getWorksheetDetails = async (id) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/worksheets/${id}`);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch worksheet details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Create new max supply
  const createMaxSupply = async (maxSupplyData) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/max-supplies', maxSupplyData);
      setMaxSupplies([response.data.data, ...maxSupplies]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create max supply');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single max supply
  const getMaxSupply = async (id) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/max-supplies/${id}`);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch max supply');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update max supply
  const updateMaxSupply = async (id, maxSupplyData) => {
    try {
      setIsLoading(true);
      const response = await axios.put(`/api/max-supplies/${id}`, maxSupplyData);
      
      // Update the local state
      setMaxSupplies(
        maxSupplies.map(item => 
          item.id === id ? response.data.data : item
        )
      );
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update max supply');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update status
  const updateStatus = async (id, statusData) => {
    try {
      setIsLoading(true);
      const response = await axios.patch(`/api/max-supplies/${id}/status`, statusData);
      
      // Update the local state
      setMaxSupplies(
        maxSupplies.map(item => 
          item.id === id ? response.data.data : item
        )
      );
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete max supply
  const deleteMaxSupply = async (id) => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/max-supplies/${id}`);
      
      // Update the local state
      setMaxSupplies(maxSupplies.filter(item => item.id !== id));
      
      return { success: true, message: 'Max supply deleted successfully' };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete max supply');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear any errors
  const clearError = () => {
    setError(null);
  };
  
  // Context value
  const value = {
    maxSupplies,
    calendarData,
    statistics,
    worksheetList,
    isLoading,
    error,
    fetchMaxSupplies,
    fetchCalendarData,
    fetchWeekCalendarData,
    fetchStatistics,
    fetchWorksheetList,
    getWorksheetDetails,
    createMaxSupply,
    getMaxSupply,
    updateMaxSupply,
    updateStatus,
    deleteMaxSupply,
    clearError,
  };
  
  return (
    <MaxSupplyContext.Provider value={value}>
      {children}
    </MaxSupplyContext.Provider>
  );
};
