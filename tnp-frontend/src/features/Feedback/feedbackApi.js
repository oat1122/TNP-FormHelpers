import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const feedbackApi = createApi({
  reducerPath: 'feedbackApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api', 
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      headers.set('X-Requested-With', 'XMLHttpRequest');
      return headers;
    },
  }),
  tagTypes: ['Feedback', 'EncouragingMessage', 'FeedbackStats'],
  endpoints: (builder) => ({
    // Feedback Report endpoints
    getFeedbackReports: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.per_page) queryParams.append('per_page', params.per_page);
        if (params.sort_field) queryParams.append('sort_field', params.sort_field);
        if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
        if (params.search) queryParams.append('search', params.search);
        if (params.category) queryParams.append('category', params.category);
        if (params.priority) queryParams.append('priority', params.priority);
        if (params.resolved !== undefined) queryParams.append('resolved', params.resolved);
        
        return {
          url: `/feedback-reports?${queryParams.toString()}`,
        };
      },
      providesTags: ['Feedback'],
    }),
    
    getFeedbackReport: builder.query({
      query: (id) => `/feedback-reports/${id}`,
      providesTags: (result, error, id) => [{ type: 'Feedback', id }],
    }),
    
    createFeedbackReport: builder.mutation({
      query: (data) => ({
        url: '/feedback-reports',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Feedback', 'FeedbackStats'],
    }),
    
    addAdminResponse: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/feedback-reports/${id}/admin-response`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Feedback', id },
        'Feedback',
      ],
    }),
    
    updateResolvedStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/feedback-reports/${id}/resolved-status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Feedback', id },
        'Feedback',
        'FeedbackStats',
      ],
    }),
    
    deleteFeedbackReport: builder.mutation({
      query: (id) => ({
        url: `/feedback-reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Feedback', 'FeedbackStats'],
    }),
    
    getFeedbackStatistics: builder.query({
      query: () => '/feedback-statistics',
      providesTags: ['FeedbackStats'],
    }),
    
    // Encouraging Message endpoints
    getRandomMessage: builder.query({
      query: (category) => {
        const queryParams = new URLSearchParams();
        
        if (category) queryParams.append('category', category);
        
        return {
          url: `/encouraging-messages/random?${queryParams.toString()}`,
        };
      },
    }),
    
    getAllMessages: builder.query({
      query: () => '/encouraging-messages',
      providesTags: ['EncouragingMessage'],
    }),
    
    createMessage: builder.mutation({
      query: (data) => ({
        url: '/encouraging-messages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EncouragingMessage'],
    }),
    
    updateMessage: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/encouraging-messages/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'EncouragingMessage', id },
        'EncouragingMessage',
      ],
    }),
    
    toggleMessageStatus: builder.mutation({
      query: (id) => ({
        url: `/encouraging-messages/${id}/toggle-active`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'EncouragingMessage', id },
        'EncouragingMessage',
      ],
    }),
  }),
});

export const {
  // Feedback Report hooks
  useGetFeedbackReportsQuery,
  useGetFeedbackReportQuery,
  useCreateFeedbackReportMutation,
  useAddAdminResponseMutation,
  useUpdateResolvedStatusMutation,
  useDeleteFeedbackReportMutation,
  useGetFeedbackStatisticsQuery,
  
  // Encouraging Message hooks
  useGetRandomMessageQuery,
  useGetAllMessagesQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useToggleMessageStatusMutation,
} = feedbackApi;
