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
          sales_name = "",
          user_role = "",
          due_date_from = "",
          due_date_to = "",
          exam_date_from = "",
          exam_date_to = "",
          created_date_from = "",
          created_date_to = "",
        } = params;
        const qp = {
          page: page.toString(),
          per_page: per_page.toString(),
          search,
          sales_name,
          user_role,
        };
        // Only include non-empty date params
        if (due_date_from) qp.due_date_from = due_date_from;
        if (due_date_to) qp.due_date_to = due_date_to;
        if (exam_date_from) qp.exam_date_from = exam_date_from;
        if (exam_date_to) qp.exam_date_to = exam_date_to;
        if (created_date_from) qp.created_date_from = created_date_from;
        if (created_date_to) qp.created_date_to = created_date_to;
        const queryParams = new URLSearchParams(qp).toString();
        return `worksheets?${queryParams}`;
      },
      providesTags: ["Worksheet"],
      // Serialize query args based on filters (not page) for cache merging
      serializeQueryArgs: ({ queryArgs }) => {
        const {
          search = "",
          sales_name = "",
          user_role = "",
          per_page = 15,
          due_date_from = "",
          due_date_to = "",
          exam_date_from = "",
          exam_date_to = "",
          created_date_from = "",
          created_date_to = "",
        } = queryArgs || {};
        return {
          search,
          sales_name,
          user_role,
          per_page,
          due_date_from,
          due_date_to,
          exam_date_from,
          exam_date_to,
          created_date_from,
          created_date_to,
        };
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
