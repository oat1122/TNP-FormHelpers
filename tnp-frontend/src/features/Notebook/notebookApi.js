import { createApi } from "@reduxjs/toolkit/query/react";
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
          status: params?.status,
        },
      }),
      providesTags: ["Notebook"],
    }),
    getNotebook: builder.query({
      query: (id) => ({
        url: `/notebooks/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Notebook", id }],
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
  }),
});

export const {
  useGetNotebooksQuery,
  useGetNotebookQuery,
  useAddNotebookMutation,
  useUpdateNotebookMutation,
  useDeleteNotebookMutation,
} = notebookApi;
