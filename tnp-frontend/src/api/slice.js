// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { apiConfig } from "./apiConfig";

// Define a service using a base URL and expected endpoints
export const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Production", "Pattern", "Fabric"],
  endpoints: (builder) => ({
    getAllSheets: builder.query({
      query: () => `getProduction`,
      providesTags: ["Production"],
    }),
    getEmbroidList: builder.query({
      query: () => `getEnumEmbroid`,
      providesTags: ["Production"],
    }),
    getScreenList: builder.query({
      query: () => `getEnumScreen`,
      providesTags: ["Production"],
    }),
    getDftList: builder.query({
      query: () => `getEnumDft`,
      providesTags: ["Production"],
    }),
    getCosts: builder.query({
      query: (pd_id) => `getCost/${pd_id}`,
      providesTags: ["Production"],
    }),
    getNotes: builder.query({
      query: (pd_id) => `note/${pd_id}`,
      providesTags: ["Production"],
    }),
    getAllNotes: builder.query({
      query: () => `note`,
      providesTags: ["Production"],
    }),
    getFactory: builder.query({
      query: () => `getFactory`,
    }),
    getPdCount: builder.query({
      query: () => `getPdCount`,
      transformResponse: (response) => response, // Return the full response object
    }),
    addNewNote: builder.mutation({
      query: (payload) => ({
        url: "/note",
        method: "POST",
        body: payload,
      }),
    }),
    delNote: builder.mutation({
      query: (note_id) => ({
        url: `/note/${note_id}`,
        method: "DELETE",
      }),
    }),
    updateProcess: builder.mutation({
      query: (payload) => ({
        url: "/note",
        method: "POST",
        body: payload,
      }),
    }),
    resetTime: builder.mutation({
      query: (pd_id) => ({
        url: "resetEndTimeStartWork", // Adjust the endpoint URL as needed
        method: "POST", // Adjust the HTTP method as needed
        body: { pd_id }, // Include pdId in the request body
        providesTags: ["Production"],
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllSheetsQuery,
  useGetEmbroidListQuery,
  useGetScreenListQuery,
  useGetDftListQuery,
  useGetCostsQuery,
  useGetNotesQuery,
  useGetAllNotesQuery,
  useGetFactoryQuery,
  useGetPdCountQuery,
  useAddNewNoteMutation,
  useDelNoteMutation,
  useResetTimeMutation,
} = apiSlice;
