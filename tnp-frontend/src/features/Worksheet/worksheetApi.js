import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { apiConfig } from "../../api/apiConfig";

export const worksheetApi = createApi({
  reducerPath: "worksheetApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Worksheet", "Customer"],
  endpoints: (builder) => ({
    getAllWorksheet: builder.query({
      query: (params = {}) => {
        const {
          page = 1,
          per_page = 15,
          search = "",
          status = "",
          sales_name = "",
          user_role = "",
        } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          per_page: per_page.toString(),
          search,
          status,
          sales_name,
          user_role,
        }).toString();
        return `worksheets?${queryParams}`;
      },
      providesTags: ["Worksheet"],
      // Serialize query args based on filters (not page) for cache merging
      serializeQueryArgs: ({ queryArgs }) => {
        const {
          search = "",
          status = "",
          sales_name = "",
          user_role = "",
          per_page = 15,
        } = queryArgs || {};
        return { search, status, sales_name, user_role, per_page };
      },
      // Merge pages for infinite scroll
      merge: (currentCache, newItems, { arg }) => {
        if (!arg || arg.page === 1) {
          return newItems;
        }
        return {
          ...newItems,
          data: [...(currentCache?.data || []), ...(newItems?.data || [])],
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg !== previousArg,
    }),
    // Deprecated: use getAllWorksheet with page param instead
    getMoreWorksheet: builder.query({
      query: (page) => `worksheets?page=${page}`,
      providesTags: ["Worksheet"],
    }),
    getWorksheet: builder.query({
      query: (worksheet_id) => `worksheets/${worksheet_id}`,
      providesTags: ["Worksheet"],
    }),
    getAllCustomer: builder.query({
      query: () => `get-all-customers`,
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
