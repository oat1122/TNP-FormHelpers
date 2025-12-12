import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { apiConfig } from "../../api/apiConfig";

/**
 * Customer Transfer API
 *
 * RTK Query endpoints สำหรับ Customer Transfer feature
 * แยกออกมาจาก customerApi เพื่อ Single Responsibility
 */
export const customerTransferApi = createApi({
  reducerPath: "customerTransferApi",
  baseQuery: fetchBaseQuery(apiConfig),
  tagTypes: ["TransferHistory", "Customer"],
  endpoints: (builder) => ({
    /**
     * Transfer customer to Sales channel
     * POST /customers/{id}/transfer-to-sales
     *
     * @param {Object} payload
     * @param {string} payload.customerId - Customer UUID
     * @param {number} [payload.newManageBy] - Optional: User ID to assign
     * @param {string} [payload.remark] - Optional: Transfer remark
     */
    transferToSales: builder.mutation({
      query: ({ customerId, newManageBy, remark }) => ({
        url: `/customers/${customerId}/transfer-to-sales`,
        method: "POST",
        body: {
          new_manage_by: newManageBy,
          remark: remark,
        },
      }),
      invalidatesTags: ["TransferHistory", "Customer"],
    }),

    /**
     * Transfer customer to Online channel
     * POST /customers/{id}/transfer-to-online
     *
     * @param {Object} payload
     * @param {string} payload.customerId - Customer UUID
     * @param {number} [payload.newManageBy] - Optional: User ID to assign
     * @param {string} [payload.remark] - Optional: Transfer remark
     */
    transferToOnline: builder.mutation({
      query: ({ customerId, newManageBy, remark }) => ({
        url: `/customers/${customerId}/transfer-to-online`,
        method: "POST",
        body: {
          new_manage_by: newManageBy,
          remark: remark,
        },
      }),
      invalidatesTags: ["TransferHistory", "Customer"],
    }),

    /**
     * Get transfer history for a customer
     * GET /customers/{id}/transfer-history
     *
     * @param {string} customerId - Customer UUID
     */
    getTransferHistory: builder.query({
      query: (customerId) => ({
        url: `/customers/${customerId}/transfer-history`,
        method: "GET",
      }),
      providesTags: (result, error, customerId) => [{ type: "TransferHistory", id: customerId }],
    }),

    /**
     * Get transfer info for a customer (can user transfer?)
     * GET /customers/{id}/transfer-info
     *
     * @param {string} customerId - Customer UUID
     */
    getTransferInfo: builder.query({
      query: (customerId) => ({
        url: `/customers/${customerId}/transfer-info`,
        method: "GET",
      }),
    }),
  }),
});

// Export hooks
export const {
  useTransferToSalesMutation,
  useTransferToOnlineMutation,
  useGetTransferHistoryQuery,
  useLazyGetTransferHistoryQuery,
  useGetTransferInfoQuery,
  useLazyGetTransferInfoQuery,
} = customerTransferApi;
