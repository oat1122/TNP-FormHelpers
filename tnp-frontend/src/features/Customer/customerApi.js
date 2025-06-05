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
          sales_name: payload?.salesName,
          channel: payload?.channel,
          recall_min: payload?.recallMin,
          recall_max: payload?.recallMax,
        };

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString ? `/customers?${queryString}` : '/customers';

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
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDelCustomerMutation,
  useUpdateRecallMutation,
} = customerApi;
