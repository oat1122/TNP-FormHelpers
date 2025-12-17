import { createApi } from "@reduxjs/toolkit/query/react";

import axiosBaseQuery from "./axiosBaseQuery";

/**
 * Helper function to ensure each row has a unique ID
 * Prevents MissingRowIdError in DataGrid
 */
const ensureRowIds = (data) => {
  if (!Array.isArray(data)) return data;
  return data.map((row) => {
    if (!row.cus_id) {
      return { ...row, cus_id: `row-${Math.random().toString(36).substring(2, 15)}` };
    }
    return row;
  });
};

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Customer", "CustomerCounts"],
  endpoints: (builder) => ({
    getAllCustomer: builder.query({
      query: (payload) => {
        // Build params object - Axios will handle URL encoding
        const params = {
          group: payload?.group,
          page: payload?.page + 1,
          per_page: payload?.per_page,
          user: payload?.user_id,
          search: payload?.search,
        };

        // Add sort parameters if they exist
        if (payload?.sortModel && payload.sortModel.length > 0) {
          params.sort_field = payload.sortModel[0].field;
          params.sort_direction = payload.sortModel[0].sort;
        }

        // Add advanced filter parameters if they exist
        if (payload?.filters) {
          if (payload.filters.dateRange?.startDate) {
            params.start_date = payload.filters.dateRange.startDate;
          }
          if (payload.filters.dateRange?.endDate) {
            params.end_date = payload.filters.dateRange.endDate;
          }
          if (Array.isArray(payload.filters.salesName) && payload.filters.salesName.length > 0) {
            params.sales_names = payload.filters.salesName.join(",");
          }
          if (Array.isArray(payload.filters.channel) && payload.filters.channel.length > 0) {
            params.channels = payload.filters.channel.join(",");
          }
        }

        // Add subordinate_user_ids for HEAD visibility
        if (payload?.subordinate_user_ids && payload.subordinate_user_ids.length > 0) {
          params.subordinate_user_ids = payload.subordinate_user_ids.join(",");
        }

        return {
          url: "/customers",
          method: "GET",
          params, // Let Axios handle query string
        };
      },
      // Transform response to ensure row IDs before caching
      transformResponse: (response) => {
        if (response.data) {
          return { ...response, data: ensureRowIds(response.data) };
        }
        return response;
      },
      providesTags: ["Customer"],
    }),
    getCustomer: builder.query({
      query: (customerId) => ({
        url: `/customers/${customerId}`,
        method: "GET",
      }),
      providesTags: (result, error, customerId) => [{ type: "Customer", id: customerId }],
    }),
    addCustomer: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (payload) => ({
        url: `/customers`,
        method: "POST",
        data: payload,
      }),
    }),
    updateCustomer: builder.mutation({
      invalidatesTags: (result, error, payload) => [
        "Customer",
        { type: "Customer", id: payload.cus_id },
      ],
      query: (payload) => ({
        url: `/customers/${payload.cus_id}`,
        method: "PUT",
        data: payload,
      }),
    }),
    delCustomer: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (cus_id) => ({
        url: `/customers/${cus_id}`,
        method: "DELETE",
      }),
    }),
    updateRecall: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (payload) => ({
        url: `/customerRecall/${payload.cd_id}`,
        method: "PUT",
        data: payload,
      }),
    }),
    changeGrade: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (payload) => ({
        url: `/customerChangeGrade/${payload.customerId}`,
        method: "PUT",
        data: { direction: payload.direction },
      }),
    }),
    // Telesales & Allocation endpoints
    getPoolCustomers: builder.query({
      query: (payload) => ({
        url: "/customers/pool",
        method: "GET",
        params: {
          page: payload?.page + 1,
          per_page: payload?.per_page || 30,
          search: payload?.search,
          source: payload?.source,
        },
      }),
      providesTags: ["Customer"],
    }),
    assignCustomers: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (payload) => ({
        url: `/customers/assign`,
        method: "PATCH",
        data: {
          customer_ids: payload.customer_ids,
          sales_user_id: payload.sales_user_id,
          force: payload.force || false,
        },
      }),
    }),
    getTelesalesStats: builder.query({
      query: (payload) => ({
        url: "/stats/telesales-dashboard",
        method: "GET",
        params: {
          start_date: payload?.start_date,
          end_date: payload?.end_date,
        },
      }),
    }),
    // Pool Telesales - customers from telesales source
    getPoolTelesalesCustomers: builder.query({
      query: (payload) => ({
        url: "/customers/pool/telesales",
        method: "GET",
        params: {
          page: payload?.page + 1,
          per_page: payload?.per_page || 30,
          search: payload?.search,
        },
      }),
      transformResponse: (response) => {
        if (response.data) {
          return { ...response, data: ensureRowIds(response.data) };
        }
        return response;
      },
      providesTags: ["Customer"],
    }),
    // Pool Transferred - customers transferred from other teams
    getPoolTransferredCustomers: builder.query({
      query: (payload) => ({
        url: "/customers/pool/transferred",
        method: "GET",
        params: {
          page: payload?.page + 1,
          per_page: payload?.per_page || 30,
          channel: payload?.channel, // 1=SALES, 2=ONLINE
        },
      }),
      transformResponse: (response) => {
        if (response.data) {
          return { ...response, data: ensureRowIds(response.data) };
        }
        return response;
      },
      providesTags: ["Customer"],
    }),
    checkDuplicateCustomer: builder.mutation({
      query: (payload) => ({
        url: `/customers/check-duplicate`,
        method: "POST",
        data: {
          type: payload.type,
          value: payload.value,
        },
      }),
    }),
    // Group counts endpoint (moved from useFilterGroupCounts hook)
    getCustomerGroupCounts: builder.query({
      query: (payload) => {
        const params = {
          user: payload?.user_id,
          counts_only: true,
        };

        if (payload?.filters) {
          if (payload.filters.dateRange?.startDate) {
            params.start_date = payload.filters.dateRange.startDate;
          }
          if (payload.filters.dateRange?.endDate) {
            params.end_date = payload.filters.dateRange.endDate;
          }
          if (Array.isArray(payload.filters.salesName) && payload.filters.salesName.length > 0) {
            params.sales_names = payload.filters.salesName.join(",");
          }
          if (Array.isArray(payload.filters.channel) && payload.filters.channel.length > 0) {
            params.channels = payload.filters.channel.join(",");
          }
        }

        return {
          url: "/customerGroupCounts",
          method: "GET",
          params,
        };
      },
      providesTags: ["CustomerCounts"],
    }),
  }),
});

export const {
  useGetAllCustomerQuery,
  useGetCustomerQuery,
  useLazyGetCustomerQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDelCustomerMutation,
  useUpdateRecallMutation,
  useChangeGradeMutation,
  useGetPoolCustomersQuery,
  useLazyGetPoolCustomersQuery,
  useGetPoolTelesalesCustomersQuery,
  useGetPoolTransferredCustomersQuery,
  useAssignCustomersMutation,
  useGetTelesalesStatsQuery,
  useLazyGetTelesalesStatsQuery,
  useCheckDuplicateCustomerMutation,
  useGetCustomerGroupCountsQuery,
} = customerApi;
