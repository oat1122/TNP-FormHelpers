import { createApi } from "@reduxjs/toolkit/query/react";

import {
  normalizeCustomerCareSourceResponse,
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
          scope: params?.scope,
          search: params?.search,
          start_date: params?.start_date,
          end_date: params?.end_date,
          date_filter_by: params?.date_filter_by,
          status: params?.status,
          action: params?.action,
          entry_type: params?.entry_type,
          manage_by: params?.manage_by,
          workflow: params?.workflow,
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
          scope: params?.scope,
          search: params?.search,
          start_date: params?.start_date,
          end_date: params?.end_date,
          date_filter_by: params?.date_filter_by,
          status: params?.status,
          action: params?.action,
          entry_type: params?.entry_type,
          manage_by: params?.manage_by,
          workflow: params?.workflow,
          include: params?.include || "histories",
          paginate: false,
        },
      }),
      transformResponse: normalizeNotebookExportResponse,
      providesTags: ["Notebook"],
    }),
    getNotebookSelfReport: builder.query({
      query: (params) => ({
        url: "/notebooks/self-report",
        method: "GET",
        params: {
          start_date: params?.start_date,
          end_date: params?.end_date,
          include: "histories",
        },
      }),
      providesTags: ["Notebook"],
    }),
    getCustomerCareSources: builder.query({
      query: (params) => ({
        url: "/notebooks/customer-care/sources",
        method: "GET",
        params: {
          source: params?.source,
          search: params?.search,
          page: params?.page + 1,
          per_page: params?.per_page || 10,
        },
      }),
      transformResponse: normalizeCustomerCareSourceResponse,
    }),
    addNotebook: builder.mutation({
      query: (data) => ({
        url: "/notebooks",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Notebook"],
    }),
    addCustomerCare: builder.mutation({
      query: (data) => ({
        url: "/notebooks/customer-care",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Notebook"],
    }),
    addPersonalActivity: builder.mutation({
      query: (data) => ({
        url: "/notebooks/personal",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Notebook"],
    }),
    addNotebookLead: builder.mutation({
      query: (data) => ({
        url: "/notebooks/leads",
        method: "POST",
        data: {
          ...data,
          ...(data?.target_scope ? { target_scope: data.target_scope } : {}),
        },
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
    reserveNotebook: builder.mutation({
      query: ({ id }) => ({
        url: `/notebooks/${id}/reserve`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => ["Notebook", { type: "Notebook", id }],
    }),
    assignNotebook: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/notebooks/${id}/assign`,
        method: "POST",
        data,
      }),
      invalidatesTags: (result, error, { id }) => ["Notebook", { type: "Notebook", id }],
    }),
    assignNotebooks: builder.mutation({
      query: (data) => ({
        url: "/notebooks/assign",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Notebook"],
    }),
  }),
});

export const {
  useGetNotebooksQuery,
  useGetNotebookQuery,
  useLazyGetNotebookExportQuery,
  useLazyGetNotebookSelfReportQuery,
  useGetCustomerCareSourcesQuery,
  useAddNotebookMutation,
  useAddCustomerCareMutation,
  useAddPersonalActivityMutation,
  useAddNotebookLeadMutation,
  useUpdateNotebookMutation,
  useDeleteNotebookMutation,
  useConvertNotebookMutation,
  useReserveNotebookMutation,
  useAssignNotebookMutation,
  useAssignNotebooksMutation,
} = notebookApi;
