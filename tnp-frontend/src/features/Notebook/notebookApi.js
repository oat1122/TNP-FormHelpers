import { createApi } from "@reduxjs/toolkit/query/react";

import {
  normalizeNotebookExportResponse,
  normalizeNotebookListResponse,
} from "./notebookApiAdapters";
import axiosBaseQuery from "../Customer/axiosBaseQuery";

export const notebookApi = createApi({
  reducerPath: "notebookApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Notebook"],
  endpoints: (builder) => ({
    getNotebooks: builder.query({
      query: (params) => ({
        url: "/notebooks",
        method: "GET",
        params: {
          page: params?.page + 1,
          per_page: params?.per_page || 15,
          search: params?.search,
          start_date: params?.start_date,
          end_date: params?.end_date,
          date_filter_by: params?.date_filter_by,
          status: params?.status,
          action: params?.action,
          manage_by: params?.manage_by,
          include: params?.include,
        },
      }),
      transformResponse: normalizeNotebookListResponse,
      providesTags: (result) => {
        const rowTags = result?.rows?.map((item) => ({ type: "Notebook", id: item.id })) || [];
        return ["Notebook", ...rowTags];
      },
    }),
    getNotebook: builder.query({
      query: (id) => ({
        url: `/notebooks/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Notebook", id }, "NotebookHistory"],
    }),
    getNotebookExport: builder.query({
      query: (params) => ({
        url: "/notebooks",
        method: "GET",
        params: {
          search: params?.search,
          start_date: params?.start_date,
          end_date: params?.end_date,
          date_filter_by: params?.date_filter_by,
          status: params?.status,
          action: params?.action,
          manage_by: params?.manage_by,
          include: params?.include || "histories",
          paginate: false,
        },
      }),
      transformResponse: normalizeNotebookExportResponse,
      providesTags: ["Notebook"],
    }),
    addNotebook: builder.mutation({
      query: (data) => ({
        url: "/notebooks",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Notebook"],
    }),
    updateNotebook: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/notebooks/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (result, error, { id }) => ["Notebook", { type: "Notebook", id }],
    }),
    deleteNotebook: builder.mutation({
      query: (id) => ({
        url: `/notebooks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notebook"],
    }),
    convertNotebook: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/notebooks/${id}/convert`,
        method: "POST",
        data,
      }),
      invalidatesTags: (result, error, { id }) => ["Notebook", { type: "Notebook", id }],
    }),
  }),
});

export const {
  useGetNotebooksQuery,
  useGetNotebookQuery,
  useLazyGetNotebookExportQuery,
  useAddNotebookMutation,
  useUpdateNotebookMutation,
  useDeleteNotebookMutation,
  useConvertNotebookMutation,
} = notebookApi;
