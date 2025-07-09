import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";

export const worksheetApi = createApi({
  reducerPath: "worksheetApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Worksheet", "Customer"],
  endpoints: (builder) => ({
    getAllWorksheet: builder.query({
      query: (params = {}) => {
        const { page = 1, per_page = 10, search } = params;
        const queryParams = new URLSearchParams({ page, per_page });
        if (search) queryParams.set("search", search);
        const qs = queryParams.toString();
        return `worksheets${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Worksheet"],
    }),
    getMoreWorksheet: builder.query({
      query: (page) => `worksheets?page=${page}`,
      providesTags: ["Worksheet"],
    }),
    getWorksheet: builder.query({
      query: (worksheet_id) => `worksheets/${worksheet_id}`,
      providesTags: ["Worksheet"],
    }),
    getAllCustomer: builder.query({
      query: () => `get-all-customers`
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
