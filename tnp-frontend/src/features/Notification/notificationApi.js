import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";

/**
 * RTK Query API for Notifications
 */
export const notificationRtkApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["Notification"],
  endpoints: (builder) => ({
    /**
     * Get unread notifications
     */
    getUnreadNotifications: builder.query({
      query: () => "/notifications/unread",
      providesTags: ["Notification"],
    }),

    /**
     * Mark specific notifications as read
     */
    markAsRead: builder.mutation({
      query: (customerIds) => ({
        url: "/notifications/mark-as-read",
        method: "POST",
        body: { customer_ids: customerIds },
      }),
      invalidatesTags: ["Notification"],
    }),

    /**
     * Mark all notifications as read
     */
    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/mark-all-as-read",
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const { useGetUnreadNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } =
  notificationRtkApi;
