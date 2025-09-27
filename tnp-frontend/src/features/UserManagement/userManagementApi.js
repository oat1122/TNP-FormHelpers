import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";
import qs from "qs";

export const userManagementApi = createApi({
  reducerPath: "userManagementApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["UserManagement"],
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
  }),
});

export const {
  useGetAllUserQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDelUserMutation,
  useResetPasswordMutation,
} = userManagementApi;
