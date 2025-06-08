import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";
import qs from "qs";

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Customer"],
  endpoints: (builder) => ({
    getAllCustomer: builder.query({
      query: (payload) => {
        // Prepare query parameters
        const queryParams = {};
        
        // Basic parameters
        if (payload?.group) queryParams.group = payload.group;
        if (payload?.page !== undefined) queryParams.page = payload.page + 1; // API expects 1-based
        if (payload?.per_page) queryParams.per_page = payload.per_page;
        if (payload?.user_id) queryParams.user = payload.user_id;
        if (payload?.search) queryParams.search = payload.search;
        
        // Date filters
        if (payload?.dateStart) queryParams.date_start = payload.dateStart;
        if (payload?.dateEnd) queryParams.date_end = payload.dateEnd;
        
        // Recall filters
        if (payload?.recallMin !== null && payload?.recallMin !== undefined) {
          queryParams.recall_min = payload.recallMin;
        }
        if (payload?.recallMax !== null && payload?.recallMax !== undefined) {
          queryParams.recall_max = payload.recallMax;
        }

        // Build query string manually for arrays to ensure bracket format
        let queryParts = [];
        
        // Add non-array parameters
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== '') {
            queryParts.push(`${key}=${encodeURIComponent(queryParams[key])}`);
          }
        });
        
        // Add array parameters with bracket notation
        if (payload?.salesName && Array.isArray(payload.salesName) && payload.salesName.length > 0) {
          payload.salesName.forEach(name => {
            queryParts.push(`sales_name[]=${encodeURIComponent(name)}`);
          });
        }
        
        if (payload?.channel && Array.isArray(payload.channel) && payload.channel.length > 0) {
          payload.channel.forEach(ch => {
            queryParts.push(`channel[]=${encodeURIComponent(ch)}`);
          });
        }
        
        const queryString = queryParts.join('&');
        const url = queryString ? `/customers?${queryString}` : '/customers';

        console.log('=== CUSTOMER API REQUEST ===');
        console.log('Payload:', payload);
        console.log('Query string:', queryString);
        console.log('Final URL:', url);
        console.log('===========================');

        return {
          url: url,
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