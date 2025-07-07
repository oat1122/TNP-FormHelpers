import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig, apiClient } from "../../api/apiConfig";
import { useQuery } from '@tanstack/react-query';
import qs from 'qs';

export const worksheetApi = createApi({
  reducerPath: "worksheetApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Worksheet", "Customer"],
  endpoints: (builder) => ({
    getAllWorksheet: builder.query({
      query: () => `worksheets`,
      providesTags: ["Worksheet"],
    }),
    getMoreWorksheet: builder.query({
      query: (page) => `worksheets?page=${page}`,
      providesTags: ["Worksheet"],
    }),
    getWorksheet: builder.query({
      query: (worksheet_id) => `worksheets/${worksheet_id}`,
      providesTags: ["Worksheet"],
    }),
    getAllCustomer: builder.query({
      query: () => `get-all-customers`
    }),
    getShirtPattern: builder.query({
      query: () => `shirt-patterns`,
    }),
    addWorksheet: builder.mutation({
      invalidatesTags: ["Worksheet"],
      query: (payload) => ({
        url: `/worksheets`,
        method: "POST",
        body: payload,
      }),
    }),
    updateWorksheet: builder.mutation({
      invalidatesTags: ["Worksheet"],
      query: (payload) => ({
        url: `/worksheets/${payload.worksheet_id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    delWorksheet: builder.mutation({
      invalidatesTags: ["Worksheet"],
      query: (worksheet_id) => ({
        url: `/worksheets/${worksheet_id}`,
        method: "DELETE",
      }),
    }),
    updateWorksheetStatus: builder.mutation({
      invalidatesTags: ["Worksheet"],
      query: (payload) => ({
        url: `/worksheet-update-status`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

// Tanstack Query API Functions for MaxSupply integration
const worksheetAPI = {
  getAll: async (filters = {}) => {
    const queryParams = {
      page: filters?.page || 1,
      per_page: filters?.per_page || 10,
      search: filters?.search,
    };

    const queryString = qs.stringify(queryParams, { skipNulls: true });
    const url = queryString ? `/worksheets?${queryString}` : '/worksheets';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/worksheets/${id}`);
    return response.data;
  },
};

// Tanstack Query Hooks
export const useWorksheetList = (filters = {}) => {
  return useQuery({
    queryKey: ['worksheets', 'list', filters],
    queryFn: () => worksheetAPI.getAll(filters),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useWorksheetDetail = (id) => {
  return useQuery({
    queryKey: ['worksheets', 'detail', id],
    queryFn: () => worksheetAPI.getById(id),
    enabled: !!id,
  });
};

export const {
  useGetAllWorksheetQuery,
  useGetWorksheetQuery,
  useGetMoreWorksheetQuery,
  useGetAllCustomerQuery,
  useGetShirtPatternQuery,
  useAddWorksheetMutation,
  useUpdateWorksheetMutation,
  useDelWorksheetMutation,
  useUpdateWorksheetStatusMutation,
} = worksheetApi;
