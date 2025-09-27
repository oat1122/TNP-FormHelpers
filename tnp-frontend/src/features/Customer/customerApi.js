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
    changeGrade: builder.mutation({
      invalidatesTags: ["Customer"],
      query: (payload) => ({
        url: `/customerChangeGrade/${payload.customerId}`,
        method: "PUT",
        body: { direction: payload.direction },
      }),
    }),
  }),
});

export const {
  useGetAllCustomerQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDelCustomerMutation,
  useUpdateRecallMutation,
  useChangeGradeMutation,
} = customerApi;
