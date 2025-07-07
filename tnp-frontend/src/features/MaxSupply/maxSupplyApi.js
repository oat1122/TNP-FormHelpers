import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiConfig';
import qs from 'qs';

// API Configuration
const MAX_SUPPLY_ENDPOINTS = {
  list: '/max-supply',
  detail: (id) => `/max-supply/${id}`,
  create: '/max-supply',
  update: (id) => `/max-supply/${id}`,
  delete: (id) => `/max-supply/${id}`,
  updateStatus: (id) => `/max-supply/${id}/status`,
  calendar: '/max-supply/calendar',
  auditLogs: (id) => `/max-supply/${id}/audit-logs`,
  stats: '/max-supply/dashboard/stats',
  files: (id) => `/max-supply/${id}/files`,
  uploadFiles: (id) => `/max-supply/${id}/files`,
  deleteFile: (maxSupplyId, fileId) => `/max-supply/${maxSupplyId}/files/${fileId}`,
  downloadFile: (maxSupplyId, fileId) => `/max-supply/${maxSupplyId}/files/${fileId}/download`,
};

// Query Keys
export const MAX_SUPPLY_QUERY_KEYS = {
  all: ['maxSupply'],
  lists: () => [...MAX_SUPPLY_QUERY_KEYS.all, 'list'],
  list: (filters) => [...MAX_SUPPLY_QUERY_KEYS.lists(), { filters }],
  details: () => [...MAX_SUPPLY_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...MAX_SUPPLY_QUERY_KEYS.details(), id],
  calendar: (filters) => [...MAX_SUPPLY_QUERY_KEYS.all, 'calendar', { filters }],
  auditLogs: (id) => [...MAX_SUPPLY_QUERY_KEYS.all, 'audit', id],
  stats: () => [...MAX_SUPPLY_QUERY_KEYS.all, 'stats'],
  files: (id) => [...MAX_SUPPLY_QUERY_KEYS.all, 'files', id],
};

// API Functions
const maxSupplyAPI = {
  // Get all max supply records with filters and pagination
  getAll: async (filters = {}) => {
    const queryParams = {
      status: filters?.status,
      priority: filters?.priority,
      page: filters?.page || 1,
      per_page: filters?.per_page || 10,
      search: filters?.search,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    };

    const queryString = qs.stringify(queryParams, { skipNulls: true });
    const url = queryString ? `${MAX_SUPPLY_ENDPOINTS.list}?${queryString}` : MAX_SUPPLY_ENDPOINTS.list;
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get single max supply record
  getById: async (id) => {
    const response = await apiClient.get(MAX_SUPPLY_ENDPOINTS.detail(id));
    return response.data;
  },

  // Create new max supply record
  create: async (data) => {
    const response = await apiClient.post(MAX_SUPPLY_ENDPOINTS.create, data);
    return response.data;
  },

  // Update max supply record
  update: async ({ id, ...data }) => {
    const response = await apiClient.put(MAX_SUPPLY_ENDPOINTS.update(id), data);
    return response.data;
  },

  // Delete max supply record
  delete: async (id) => {
    const response = await apiClient.delete(MAX_SUPPLY_ENDPOINTS.delete(id));
    return response.data;
  },

  // Update status only
  updateStatus: async ({ id, status }) => {
    const response = await apiClient.patch(MAX_SUPPLY_ENDPOINTS.updateStatus(id), { status });
    return response.data;
  },

  // Get audit logs
  getAuditLogs: async (id) => {
    const response = await apiClient.get(MAX_SUPPLY_ENDPOINTS.auditLogs(id));
    return response.data;
  },

  // Get calendar data
  getCalendar: async (filters = {}) => {
    const queryParams = {
      start: filters?.start,
      end: filters?.end,
      status: filters?.status,
      search: filters?.search,
    };

    const queryString = qs.stringify(queryParams, { skipNulls: true });
    const url = queryString ? `${MAX_SUPPLY_ENDPOINTS.calendar}?${queryString}` : MAX_SUPPLY_ENDPOINTS.calendar;
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get dashboard stats
  getStats: async () => {
    const response = await apiClient.get(MAX_SUPPLY_ENDPOINTS.stats);
    return response.data;
  },

  // File management
  getFiles: async (maxSupplyId) => {
    const response = await apiClient.get(MAX_SUPPLY_ENDPOINTS.files(maxSupplyId));
    return response.data;
  },

  uploadFiles: async ({ maxSupplyId, files }) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    const response = await apiClient.post(MAX_SUPPLY_ENDPOINTS.uploadFiles(maxSupplyId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFile: async ({ maxSupplyId, fileId }) => {
    const response = await apiClient.delete(MAX_SUPPLY_ENDPOINTS.deleteFile(maxSupplyId, fileId));
    return response.data;
  },

  downloadFile: async ({ maxSupplyId, fileId }) => {
    const response = await apiClient.get(MAX_SUPPLY_ENDPOINTS.downloadFile(maxSupplyId, fileId), {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Custom Hooks using Tanstack Query
export const useMaxSupplyList = (filters = {}) => {
  return useQuery({
    queryKey: MAX_SUPPLY_QUERY_KEYS.list(filters),
    queryFn: () => maxSupplyAPI.getAll(filters),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMaxSupplyDetail = (id) => {
  return useQuery({
    queryKey: MAX_SUPPLY_QUERY_KEYS.detail(id),
    queryFn: () => maxSupplyAPI.getById(id),
    enabled: !!id,
  });
};

export const useMaxSupplyCalendar = (filters = {}) => {
  return useQuery({
    queryKey: MAX_SUPPLY_QUERY_KEYS.calendar(filters),
    queryFn: () => maxSupplyAPI.getCalendar(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useMaxSupplyStats = () => {
  return useQuery({
    queryKey: MAX_SUPPLY_QUERY_KEYS.stats(),
    queryFn: maxSupplyAPI.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMaxSupplyAuditLogs = (id) => {
  return useQuery({
    queryKey: MAX_SUPPLY_QUERY_KEYS.auditLogs(id),
    queryFn: () => maxSupplyAPI.getAuditLogs(id),
    enabled: !!id,
  });
};

export const useMaxSupplyFiles = (maxSupplyId) => {
  return useQuery({
    queryKey: MAX_SUPPLY_QUERY_KEYS.files(maxSupplyId),
    queryFn: () => maxSupplyAPI.getFiles(maxSupplyId),
    enabled: !!maxSupplyId,
  });
};

// Mutation Hooks
export const useCreateMaxSupply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: maxSupplyAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.calendar() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.stats() });
    },
  });
};

export const useUpdateMaxSupply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: maxSupplyAPI.update,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.calendar() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.stats() });
    },
  });
};

export const useDeleteMaxSupply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: maxSupplyAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.calendar() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.stats() });
    },
  });
};

export const useUpdateMaxSupplyStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: maxSupplyAPI.updateStatus,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.calendar() });
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.stats() });
    },
  });
};

export const useUploadMaxSupplyFiles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: maxSupplyAPI.uploadFiles,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.files(variables.maxSupplyId) });
    },
  });
};

export const useDeleteMaxSupplyFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: maxSupplyAPI.deleteFile,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAX_SUPPLY_QUERY_KEYS.files(variables.maxSupplyId) });
    },
  });
};

export const useDownloadMaxSupplyFile = () => {
  return useMutation({
    mutationFn: maxSupplyAPI.downloadFile,
  });
};
