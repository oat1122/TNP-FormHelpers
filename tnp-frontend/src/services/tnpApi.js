// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { apiConfig } from "../api/apiConfig";

// Define a service using a base URL and expected endpoints
export const tnpApi = createApi({
  reducerPath: "tnpApi",
  baseQuery: fetchBaseQuery(apiConfig),
  endpoints: (builder) => ({
    getPattern: builder.query({
      query: () => `pattern`,
    }),
    getFabricByPatternId: builder.query({
      query: (pattern_id) => `costFabric/${pattern_id}`,
    }),
    getFabricClass: builder.query({
      query: () => `getEnumFabricClass`,
    }),
    editFabricById: builder.mutation({
      query: (fabric) => ({
        url: `costFabric`,
        method: "PUT",
        body: fabric,
      }),
    }),
    updateCostFabricOnce: builder.mutation({
      query: (fabric) => ({
        url: `costFabricOnce`,
        method: "PUT",
        body: fabric,
      }),
    }),
    deleteFabricById: builder.mutation({
      query: (fabricId) => ({
        url: `costFabric/${fabricId}`,
        method: "DELETE",
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetPatternQuery,
  useGetFabricByPatternIdQuery,
  useGetFabricClassQuery,
  useEditFabricByIdMutation,
  useDeleteFabricByIdMutation,
  useUpdateCostFabricOnceMutation,
} = tnpApi;
