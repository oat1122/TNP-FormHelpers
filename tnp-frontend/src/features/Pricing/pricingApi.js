import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";
import qs from "qs";

export const pricingApi = createApi({
  reducerPath: "pricingApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Pricing"],
  endpoints: (builder) => ({
    getAllPricing: builder.query({
      query: (payload) => {
        const queryParams = {
          status: payload?.status,
          page: payload?.page + 1,
          per_page: payload?.per_page,
          user: payload?.user_id,
          search: payload?.search,
        };

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString ? `/pricing?${queryString}` : '/pricing';

        return {
          url: url,
          method: "GET"
        }
      },
      providesTags: ["Pricing"],
    }),
    getPricing: builder.query({
      query: (pr_id) => `pricing/${pr_id}`,
      providesTags: ["Pricing"],
    }),
    addPricingReq: builder.mutation({
      invalidatesTags: ["Pricing"],
      query: (payload) => ({
        url: `/pricing`,
        method: "POST",
        body: payload,
      }),
    }),
    updatePricingReq: builder.mutation({
      invalidatesTags: ["Pricing"],
      query: (payload) => ({
        url: `/pricing/${payload.pr_id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    delPricingReq: builder.mutation({
      invalidatesTags: ["Pricing"],
      query: (pr_id) => ({
        url: `/pricing/${pr_id}`,
        method: "DELETE",
      }),
    }),
    updatePricingReqStatus: builder.mutation({
      invalidatesTags: ["Pricing"],
      query: (payload) => ({
        url: `/pricing-update-status`,
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetAllPricingQuery,
  useGetPricingQuery,
  useAddPricingReqMutation,
  useUpdatePricingReqMutation,
  useDelPricingReqMutation,
  useUpdatePricingReqStatusMutation,
} = pricingApi;
