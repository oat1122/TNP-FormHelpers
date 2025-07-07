import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';

export const useMaxSupplies = () =>
  useQuery({
    queryKey: ['max-supplies'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/max-supply');
      return data;
    }
  });

export const useMaxSupply = (id) =>
  useQuery({
    queryKey: ['max-supply', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await axios.get(`/api/v1/max-supply/${id}`);
      return data;
    }
  });

export const useCreateMaxSupply = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axios.post('/api/v1/max-supply', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries(['max-supplies'])
  });
};

export const useUpdateMaxSupply = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axios.put(`/api/v1/max-supply/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries(['max-supplies'])
  });
};

export const useDeleteMaxSupply = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/api/v1/max-supply/${id}`);
    },
    onSuccess: () => qc.invalidateQueries(['max-supplies'])
  });
};

export const useUpdateStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await axios.patch(`/api/v1/max-supply/${id}/status`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries(['max-supplies'])
  });
};

export const useCalendar = () =>
  useQuery({
    queryKey: ['max-supply-calendar'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v1/max-supply/calendar');
      return data;
    }
  });

export const useUploadFile = () =>
  useMutation({
    mutationFn: async (formData) => {
      const { data } = await axios.post('/api/v1/max-supply/upload', formData);
      return data;
    }
  });
