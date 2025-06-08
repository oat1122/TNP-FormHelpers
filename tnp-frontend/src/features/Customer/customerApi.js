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
        const queryParams = {
          group: payload?.group,
          page: payload?.page + 1,
          per_page: payload?.per_page,
          user: payload?.user_id,
          search: payload?.search,
          date_start: payload?.dateStart,
          date_end: payload?.dateEnd,
          // Handle multi-select for sales names
          sales_name: payload?.salesName && payload.salesName.length > 0 
            ? payload.salesName 
            : undefined,
          // Handle multi-select for channels
          channel: payload?.channel && payload.channel.length > 0 
            ? payload.channel 
            : undefined,
          recall_min: payload?.recallMin,
          recall_max: payload?.recallMax,
        };

        // Use qs to properly serialize arrays
        const queryString = qs.stringify(queryParams, { 
          skipNulls: true,
          arrayFormat: 'brackets' // This will format arrays as sales_name[]=value1&sales_name[]=value2
        });
        
        const url = queryString ? `/customers?${queryString}` : '/customers';

        console.log('=== API REQUEST ===');
        console.log('Payload received:', payload);
        console.log('Query params:', queryParams);
        console.log('Final URL:', url);
        console.log('==================');

        return {
          url: url,
          method: "GET"
        }
      },
      providesTags: ["Customer"],
    }),
    getAllSales: builder.query({
      query: (payload) => {
        const queryParams = {
          user: payload?.user_id,
          sales_only: true // Flag to get only sales list
        };

        const queryString = qs.stringify(queryParams, { 
          skipNulls: true
        });
        
        const url = queryString ? `/customers/sales?${queryString}` : '/customers/sales';
        
        return {
          url: url,
          method: "GET"
        }
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