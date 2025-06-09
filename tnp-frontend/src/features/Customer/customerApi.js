import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";
import qs from "qs";

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Customer"],
  // Add global RTK Query options for better caching
  keepUnusedDataFor: 300, // Keep unused endpoints' data for 5 minutes
  refetchOnMountOrArgChange: 30, // Refetch if 30 seconds have passed since last fetched
  endpoints: (builder) => ({
    getAllCustomer: builder.query({
      query: (payload) => {
        // Prepare query parameters
        const queryParams = {
          // Basic parameters with proper type checking
          group: payload?.group,
          page: payload?.page !== undefined ? payload.page + 1 : undefined, // API expects 1-based
          per_page: payload?.per_page,
          user: payload?.user_id,
          search: payload?.search || undefined,
          
          // Date filters with nullish coalescing to avoid empty strings
          date_start: payload?.dateStart || undefined,
          date_end: payload?.dateEnd || undefined,
          
          // Recall filters with proper type checking
          recall_min: payload?.recallMin ?? undefined,
          recall_max: payload?.recallMax ?? undefined,
        };

        // Remove undefined values for cleaner URLs
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === undefined || queryParams[key] === '') {
            delete queryParams[key];
          }
        });

        // Build query string for most parameters
        let query = qs.stringify(queryParams, { skipNulls: true });
        
        // Handle arrays with bracket notation if needed
        const arrayParams = [];
        
        if (payload?.salesName?.length > 0) {
          payload.salesName.forEach(name => {
            arrayParams.push(`sales_name[]=${encodeURIComponent(name)}`);
          });
        }
        
        if (payload?.channel?.length > 0) {
          payload.channel.forEach(ch => {
            arrayParams.push(`channel[]=${encodeURIComponent(ch)}`);
          });
        }
        
        // Combine query parts
        const queryString = [query, ...arrayParams].filter(Boolean).join('&');
        const url = `/customers${queryString ? `?${queryString}` : ''}`;

        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('Customer API Request:', { 
            params: queryParams,
            url
          });
        }

        return {
          url,
          method: "GET"
        };
      },
      providesTags: ["Customer"],
    }),
    getAllSales: builder.query({
      query: (payload) => {
        const queryParams = {
          user: payload?.user_id,
          sales_only: true
        };

        const queryString = qs.stringify(queryParams, { 
          skipNulls: true
        });
        
        const url = queryString ? `/customers/sales?${queryString}` : '/customers/sales';
        
        return {
          url: url,
          method: "GET"
        };
      },
      providesTags: ["Customer"],
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
      invalidatesTags: ["Customer"],
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
  }),
});

export const {
  useGetAllCustomerQuery,
  useGetAllSalesQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDelCustomerMutation,
  useUpdateRecallMutation,
} = customerApi;