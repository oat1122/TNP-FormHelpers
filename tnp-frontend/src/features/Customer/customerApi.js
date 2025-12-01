import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import qs from "qs";

import { apiConfig } from "../../api/apiConfig";

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Customer"],
  endpoints: (builder) => ({
    getAllCustomer: builder.query({
      query: (payload) => {
        const queryParams = {
          group: payload?.group,
          page: payload?.page + 1,
          per_page: payload?.per_page,
          user: payload?.user_id,
          search: payload?.search,
        };

        // Add sort parameters if they exist
        if (payload?.sortModel && payload.sortModel.length > 0) {
          queryParams.sort_field = payload.sortModel[0].field;
          queryParams.sort_direction = payload.sortModel[0].sort;
        }

        // Add advanced filter parameters if they exist
        if (payload?.filters) {
          // Date Range
          if (payload.filters.dateRange.startDate) {
            queryParams.start_date = payload.filters.dateRange.startDate;
          }
          if (payload.filters.dateRange.endDate) {
            queryParams.end_date = payload.filters.dateRange.endDate;
          }

          // Sales Name filter
          if (Array.isArray(payload.filters.salesName) && payload.filters.salesName.length > 0) {
            queryParams.sales_names = payload.filters.salesName.join(",");
          }
          // Channel filter
          if (Array.isArray(payload.filters.channel) && payload.filters.channel.length > 0) {
            queryParams.channels = payload.filters.channel.join(",");
          }
        }

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString ? `/customers?${queryString}` : "/customers";

        return {
          url: url,
          method: "GET",
        };
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
        body: payload,
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
        body: payload,
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
        body: payload,
      }),
    }),
    changeGrade: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (payload) => ({
        url: `/customerChangeGrade/${payload.customerId}`,
        method: "PUT",
        body: { direction: payload.direction },
      }),
    }),
    // Telesales & Allocation endpoints
    getPoolCustomers: builder.query({
      query: (payload) => {
        const queryParams = {
          page: payload?.page + 1,
          per_page: payload?.per_page || 30,
          search: payload?.search,
          source: payload?.source, // Filter by source (telesales, online, etc)
        };

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString ? `/customers/pool?${queryString}` : "/customers/pool";

        return {
          url: url,
          method: "GET",
        };
      },
      providesTags: ["Customer"],
    }),
    assignCustomers: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (payload) => ({
        url: `/customers/assign`,
        method: "PATCH",
        body: {
          customer_ids: payload.customer_ids,
          sales_user_id: payload.sales_user_id,
          force: payload.force || false,
        },
      }),
    }),
    getTelesalesStats: builder.query({
      query: (payload) => {
        const queryParams = {
          start_date: payload?.start_date,
          end_date: payload?.end_date,
        };

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString
          ? `/stats/telesales-dashboard?${queryString}`
          : "/stats/telesales-dashboard";

        return {
          url: url,
          method: "GET",
        };
      },
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
  useAssignCustomersMutation,
  useGetTelesalesStatsQuery,
  useLazyGetTelesalesStatsQuery,
} = customerApi;
