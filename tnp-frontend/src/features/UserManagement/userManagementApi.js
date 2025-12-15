import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import qs from "qs";

import { apiConfig } from "../../api/apiConfig";

export const userManagementApi = createApi({
  reducerPath: "userManagementApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["UserManagement", "SubRole"],
  endpoints: (builder) => ({
    getAllUser: builder.query({
      query: (payload) => {
        const queryParams = {
          page: payload?.page + 1,
          per_page: payload?.per_page,
          search: payload?.search,
        };

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString ? `/users?${queryString}` : "/users";

        return {
          url: url,
          method: "GET",
        };
      },
      providesTags: ["UserManagement"],
    }),
    addUser: builder.mutation({
      invalidatesTags: ["UserManagement"],
      query: (payload) => ({
        url: `/signup`,
        method: "POST",
        body: payload,
      }),
    }),
    updateUser: builder.mutation({
      invalidatesTags: ["UserManagement"],
      query: (payload) => ({
        url: `/user/${payload.user_uuid}`,
        method: "PUT",
        body: payload,
      }),
    }),
    delUser: builder.mutation({
      invalidatesTags: ["UserManagement"],
      query: (user_uuid) => ({
        url: `/user/${user_uuid}`,
        method: "DELETE",
      }),
    }),
    resetPassword: builder.mutation({
      invalidatesTags: ["UserManagement"],
      query: (payload) => ({
        url: `users/${payload.user_uuid}/reset-password`,
        method: "PUT",
        body: payload,
      }),
    }),

    // ============ Sub Role Management ============
    getAllSubRoles: builder.query({
      query: (payload) => {
        const queryParams = {
          page: payload?.page !== undefined ? payload.page + 1 : undefined,
          per_page: payload?.per_page,
          search: payload?.search,
          active_only: payload?.active_only,
          all: payload?.all, // For dropdown - returns all without pagination
        };

        const queryString = qs.stringify(queryParams, { skipNulls: true });
        const url = queryString ? `/sub-roles?${queryString}` : "/sub-roles";

        return {
          url: url,
          method: "GET",
        };
      },
      providesTags: ["SubRole"],
    }),
    addSubRole: builder.mutation({
      invalidatesTags: ["SubRole"],
      query: (payload) => ({
        url: `/sub-roles`,
        method: "POST",
        body: payload,
      }),
    }),
    updateSubRole: builder.mutation({
      invalidatesTags: ["SubRole"],
      query: (payload) => ({
        url: `/sub-roles/${payload.msr_id}`,
        method: "PUT",
        body: payload,
      }),
    }),
    deleteSubRole: builder.mutation({
      invalidatesTags: ["SubRole"],
      query: (msr_id) => ({
        url: `/sub-roles/${msr_id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetAllUserQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDelUserMutation,
  useResetPasswordMutation,
  // Sub Role hooks
  useGetAllSubRolesQuery,
  useAddSubRoleMutation,
  useUpdateSubRoleMutation,
  useDeleteSubRoleMutation,
} = userManagementApi;
