import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";

// Base query ที่ใช้ config ร่วมกัน
const baseQuery = fetchBaseQuery({
  baseUrl: `${apiConfig.baseUrl}`,
  prepareHeaders: apiConfig.prepareHeaders,
  credentials: apiConfig.credentials,
});

export const accountingApi = createApi({
  reducerPath: "accountingApi",
  baseQuery,
  refetchOnFocus: false, // 🔄 ปิด auto refetch เพื่อใช้ cache มากขึ้น
  refetchOnReconnect: true,
  keepUnusedDataFor: 1800, // 🔄 ตั้งค่า global cache 30 นาที
  tagTypes: [
    "PricingRequest",
    "Quotation",
    "Invoice",
    "Receipt",
    "DeliveryNote",
    "Dashboard",
    "Company",
    "Customer",
  ],
  endpoints: (builder) => ({
    // ===================== COMPANIES =====================
    getCompanies: builder.query({
      query: (params = {}) => ({ url: "/companies", params }),
      providesTags: (result) => {
        const items =
          (result?.data ?? result ?? []).map?.((c) => ({ type: "Company", id: c.id })) || [];
        return [{ type: "Company", id: "LIST" }, ...items];
      },
      keepUnusedDataFor: 60,
    }),
    getCompany: builder.query({
      query: (id) => `/companies/${id}`,
      providesTags: (result, error, id) => [{ type: "Company", id }],
    }),
    createCompany: builder.mutation({
      query: (data) => ({ url: "/companies", method: "POST", body: data }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/companies/${id}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { id }) => [
        { type: "Company", id },
        { type: "Company", id: "LIST" },
      ],
    }),
    deleteCompany: builder.mutation({
      query: (id) => ({ url: `/companies/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),

    // ===================== PRICING REQUESTS =====================
    getCompletedPricingRequests: builder.query({
      query: (params = {}) => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userUuid = userData.user_uuid || "";
        return {
          url: "/pricing-requests",
          params: {
            status: "complete",
            page: params.page || 1,
            per_page: params.per_page || 50,
            user: userUuid,
            ...params,
          },
        };
      },
      providesTags: ["PricingRequest"],
      keepUnusedDataFor: 300,
      transformResponse: (response) => {
        if (response?.data) {
          const processed = response.data.map((item) => ({
            ...item,
            _customerId: (
              item.customer?.cus_id ||
              item.pr_cus_id ||
              item.customer_id ||
              item.cus_id ||
              ""
            ).toString(),
            _displayName: item.customer?.name || item.customer?.cus_name || "Unknown Customer",
            _totalAmount: parseFloat(item.total_amount || 0),
          }));
          return { ...response, data: processed };
        }
        return response;
      },
      async onQueryStarted(_params, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          const items = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : [];
          items.forEach((item) => {
            if (item?.pr_id && item?.autofill) {
              dispatch(
                accountingApi.util.upsertQueryData(
                  "getPricingRequestAutofill",
                  item.pr_id,
                  () => ({ success: true, data: item.autofill })
                )
              );
            }
          });
        } catch (error) {
          console.warn("Prefill pricing request autofill cache failed", error);
        }
      },
    }),
    getPricingRequestAutofill: builder.query({
      query: (id) => `/pricing-requests/${id}/autofill`,
      providesTags: (r, e, id) => [{ type: "PricingRequest", id }],
      keepUnusedDataFor: 3600, // 🔄 Cache autofill data นาน 1 ชั่วโมง เพราะไม่ค่อยเปลี่ยน
      
      // 🔥 Performance: ป้องกัน refetch ซ้ำ
      merge: (currentCache, newItems) => newItems,
    }),
    getBulkPricingRequestAutofill: builder.query({
      query: (prIds) => {
        // ✅ Validate and convert to integers
        const validIds = Array.isArray(prIds) 
          ? prIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id))
          : [];
        
        return {
          url: `/pricing-requests/bulk-autofill`,
          method: 'POST',
          body: { ids: validIds },
        };
      },
      providesTags: (result, error, prIds) =>
        (result?.data || []).map(({ pr_id }) => ({ type: "PricingRequest", id: pr_id })),
      keepUnusedDataFor: 3600, // 🔄 Cache autofill data นาน 1 ชั่วโมง
      
      // 🔥 Optimize: ป้องกันการ fetch ซ้ำถ้า prIds เหมือนกัน
      serializeQueryArgs: ({ queryArgs }) => {
        // queryArgs คือ prIds array ที่ส่งเข้ามา
        // ตรวจสอบว่าเป็น array ก่อน sort เพื่อป้องกัน error
        if (!Array.isArray(queryArgs)) {
          return JSON.stringify(queryArgs);
        }
        return JSON.stringify([...queryArgs].sort());
      },
      
      // 🔥 Optimize: Force refetch เฉพาะเมื่อ prIds เปลี่ยน
      forceRefetch: ({ currentArg, previousArg }) => {
        if (!Array.isArray(currentArg) || !Array.isArray(previousArg)) {
          return true; // Force refetch if not array
        }
        const current = JSON.stringify([...currentArg].sort());
        const previous = JSON.stringify([...previousArg].sort());
        return current !== previous;
      },
      
      // 🔥 Performance: ป้องกัน refetch ซ้ำเมื่อ component mount/unmount
      // RTK Query จะ reuse cache แทนการยิง API ใหม่
      merge: (currentCache, newItems) => {
        // Return new items (replace cache completely)
        return newItems;
      },
    }),

    // ===================== QUOTATIONS =====================
    getQuotations: builder.query({
      query: (params = {}) => ({ url: "/quotations", params }),
      providesTags: ["Quotation"],
    }),
    getQuotation: builder.query({
      query: (id) => `/quotations/${id}`,
      providesTags: (r, e, id) => [{ type: "Quotation", id }],
    }),
    createQuotation: builder.mutation({
      query: (data) => ({ url: "/quotations", method: "POST", body: data }),
      invalidatesTags: ["Quotation", "Dashboard"],
    }),
    createQuotationFromPricing: builder.mutation({
      query: ({ pricingRequestId, ...additionalData }) => ({
        url: "/quotations/create-from-pricing",
        method: "POST",
        body: { pricing_request_id: pricingRequestId, ...additionalData },
      }),
      invalidatesTags: ["Quotation", "PricingRequest", "Dashboard"],
    }),
    createQuotationFromMultiplePricing: builder.mutation({
      query: ({ pricingRequestIds, customerId, ...additionalData }) => ({
        url: "/quotations/create-from-multiple-pricing",
        method: "POST",
        body: {
          pricing_request_ids: pricingRequestIds,
          customer_id: customerId,
          primary_pricing_request_ids: pricingRequestIds,
          ...additionalData,
        },
      }),
      invalidatesTags: ["Quotation", "PricingRequest", "Dashboard"],
    }),
    updateQuotation: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/quotations/${id}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }, "Quotation", "Dashboard"],
    }),
    deleteQuotation: builder.mutation({
      query: (id) => ({ url: `/quotations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Quotation", "Dashboard"],
    }),
    approveQuotation: builder.mutation({
      query: ({ id, ...approvalData }) => ({
        url: `/quotations/${id}/approve`,
        method: "POST",
        body: approvalData,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }, "Quotation", "Dashboard"],
    }),
    submitQuotation: builder.mutation({
      query: (id) => ({ url: `/quotations/${id}/submit`, method: "POST" }),
      invalidatesTags: (r, e, id) => [{ type: "Quotation", id }, "Quotation", "Dashboard"],
    }),
    rejectQuotation: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/quotations/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }, "Quotation", "Dashboard"],
    }),
    sendBackQuotation: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/quotations/${id}/send-back`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }, "Quotation"],
    }),
    revokeApprovalQuotation: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/quotations/${id}/revoke-approval`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }, "Quotation", "Dashboard"],
    }),
    markQuotationSent: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/quotations/${id}/mark-sent`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }, "Quotation"],
    }),
    uploadQuotationEvidence: builder.mutation({
      query: ({ id, files, description }) => {
        const formData = new FormData();
        if (Array.isArray(files)) files.forEach((f) => formData.append("files[]", f));
        else if (files) formData.append("files[]", files);
        if (description) formData.append("description", description);
        return {
          url: `/quotations/${id}/upload-evidence`,
          method: "POST",
          body: formData,
          headers: { "X-Skip-Json": "1" },
          formData: true,
        };
      },
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }],
    }),
    uploadQuotationSignatures: builder.mutation({
      query: ({ id, files }) => {
        const formData = new FormData();
        if (Array.isArray(files)) files.forEach((f) => formData.append("files[]", f));
        else if (files) formData.append("files[]", files);
        return {
          url: `/quotations/${id}/upload-signatures`,
          method: "POST",
          body: formData,
          headers: { "X-Skip-Json": "1" },
          formData: true,
        };
      },
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }],
    }),
    uploadQuotationSampleImages: builder.mutation({
      query: ({ id, files }) => {
        const formData = new FormData();
        if (Array.isArray(files)) files.forEach((f) => formData.append("files[]", f));
        else if (files) formData.append("files[]", files);
        return {
          url: `/quotations/${id}/upload-sample-images`,
          method: "POST",
          body: formData,
          headers: { "X-Skip-Json": "1" },
          formData: true,
        };
      },
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }],
    }),
    uploadQuotationSampleImagesTemp: builder.mutation({
      query: ({ files }) => {
        const formData = new FormData();
        if (Array.isArray(files)) files.forEach((f) => formData.append("files[]", f));
        else if (files) formData.append("files[]", files);
        return {
          url: `/quotations/upload-sample-images`,
          method: "POST",
          body: formData,
          headers: { "X-Skip-Json": "1" },
          formData: true,
        };
      },
    }),
    deleteQuotationSignatureImage: builder.mutation({
      query: ({ id, identifier }) => ({
        url: `/quotations/${id}/signatures/${encodeURIComponent(identifier)}`,
        method: "DELETE",
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }],
    }),
    sendQuotationEmail: builder.mutation({
      query: ({ id, ...emailData }) => ({
        url: `/quotations/${id}/send-email`,
        method: "POST",
        body: emailData,
      }),
    }),
    markQuotationCompleted: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/quotations/${id}/mark-completed`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Quotation", id }, "Quotation", "Dashboard"],
    }),
    generateQuotationPDF: builder.mutation({
      query: (arg) => {
        const isScalar = typeof arg === "string" || typeof arg === "number";
        const id = isScalar ? arg : arg?.id;
        const body = isScalar
          ? {}
          : {
              format: arg?.format,
              orientation: arg?.orientation,
              showWatermark: arg?.showWatermark,
            };
        return { url: `/quotations/${id}/generate-pdf`, method: "POST", body };
      },
    }),

    // ===================== INVOICES =====================
    getQuotationsAwaitingInvoice: builder.query({
      query: (params = {}) => ({ url: "/invoices/quotations-awaiting", params }),
      providesTags: ["Quotation"],
    }),
    getInvoices: builder.query({
      query: (params = {}) => ({ url: "/invoices", params }),
      providesTags: ["Invoice"],
    }),
    getInvoice: builder.query({
      query: (id) => `/invoices/${id}`,
      providesTags: (r, e, id) => [{ type: "Invoice", id }],
    }),
    createInvoiceFromQuotation: builder.mutation({
      query: ({ quotationId, ...additionalData }) => ({
        url: "/invoices/create-from-quotation",
        method: "POST",
        body: { quotation_id: quotationId, ...additionalData },
      }),
      invalidatesTags: ["Invoice", "Quotation", "Dashboard"],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/invoices/${id}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { id }) => [{ type: "Invoice", id }, "Invoice", "Dashboard"],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}`, method: "DELETE" }),
      invalidatesTags: ["Invoice", "Dashboard"],
    }),
    approveInvoice: builder.mutation({
      query: ({ id, ...approvalData }) => ({
        url: `/invoices/${id}/approve`,
        method: "POST",
        body: approvalData,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Invoice", id }, "Invoice", "Dashboard"],
    }),
    submitInvoice: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/submit`, method: "POST" }),
      invalidatesTags: (r, e, id) => [{ type: "Invoice", id }, "Invoice"],
    }),
    submitInvoiceAfterDeposit: builder.mutation({
      query: (id) => ({ url: `/invoices/${id}/submit-after-deposit`, method: "POST" }),
      invalidatesTags: (r, e, id) => [{ type: "Invoice", id }, "Invoice"],
    }),
    approveInvoiceAfterDeposit: builder.mutation({
      query: ({ id, ...approvalData }) => ({
        url: `/invoices/${id}/approve-after-deposit`,
        method: "POST",
        body: approvalData,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Invoice", id }, "Invoice", "Dashboard"],
    }),
    revertInvoiceToDraft: builder.mutation({
      query: ({ id, side, reason }) => ({
        url: `/invoices/${id}/revert-to-draft`,
        method: "POST",
        body: { side, reason },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Invoice", id }, "Invoice", "Dashboard"],
    }),
    updateInvoiceDepositDisplayOrder: builder.mutation({
      query: ({ id, order }) => ({
        url: `/invoices/${id}/deposit-display-order`,
        method: "PATCH",
        body: { deposit_display_order: order },
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Invoice", id }, "Invoice"],
    }),
    uploadInvoiceEvidence: builder.mutation({
      query: ({ id, files, description, mode = "before" }) => {
        const formData = new FormData();
        if (Array.isArray(files)) files.forEach((f) => formData.append("files[]", f));
        else if (files) formData.append("files[]", files);
        if (description) formData.append("description", description);
        if (mode) formData.append("mode", mode);
        return {
          url: `/invoices/${id}/evidence/${mode}`,
          method: "POST",
          body: formData,
          headers: { "X-Skip-Json": "1" },
          formData: true,
        };
      },
      invalidatesTags: (r, e, { id }) => [{ type: "Invoice", id }, "Invoice"],
    }),
    generateInvoicePDF: builder.mutation({
      query: ({ id, headerTypes, ...options }) => ({
        url: `/invoices/${id}/generate-pdf`,
        method: "POST",
        body: {
          ...(Array.isArray(headerTypes) && headerTypes.length ? { headerTypes } : {}),
          ...options,
        },
      }),
    }),

    // ===================== RECEIPTS =====================
    getReceipts: builder.query({
      query: (params = {}) => ({ url: "/receipts", params }),
      providesTags: ["Receipt"],
    }),
    getReceipt: builder.query({
      query: (id) => `/receipts/${id}`,
      providesTags: (r, e, id) => [{ type: "Receipt", id }],
    }),
    createReceiptFromPayment: builder.mutation({
      query: ({ invoiceId, ...paymentData }) => ({
        url: "/receipts/create-from-payment",
        method: "POST",
        body: { invoice_id: invoiceId, ...paymentData },
      }),
      invalidatesTags: ["Receipt", "Invoice", "Dashboard"],
    }),
    updateReceipt: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/receipts/${id}`, method: "PUT", body: data }),
      invalidatesTags: (r, e, { id }) => [{ type: "Receipt", id }, "Receipt", "Dashboard"],
    }),
    approveReceipt: builder.mutation({
      query: ({ id, ...approvalData }) => ({
        url: `/receipts/${id}/approve`,
        method: "POST",
        body: approvalData,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "Receipt", id }, "Receipt", "Dashboard"],
    }),
    calculateVAT: builder.query({
      query: ({ amount, vatType = "exclude" }) => ({
        url: "/receipts/calculate-vat",
        params: { amount, vat_type: vatType },
      }),
    }),
    uploadPaymentEvidence: builder.mutation({
      query: ({ receiptId, fileData }) => {
        const formData = new FormData();
        formData.append("evidence_file", fileData);
        return {
          url: `/receipts/${receiptId}/upload-evidence`,
          method: "POST",
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: (r, e, { receiptId }) => [{ type: "Receipt", id: receiptId }],
    }),
    generateReceiptPDF: builder.mutation({
      query: (id) => ({ url: `/receipts/${id}/generate-pdf`, method: "GET" }),
    }),

    // ===================== DELIVERY NOTES =====================
    getDeliveryNotes: builder.query({
      query: (params = {}) => ({ url: "/delivery-notes", params }),
      providesTags: ["DeliveryNote"],
    }),
    getDeliveryNote: builder.query({
      query: (id) => `/delivery-notes/${id}`,
      providesTags: (r, e, id) => [{ type: "DeliveryNote", id }],
    }),
    getDeliveryNoteInvoiceItems: builder.query({
      query: (params = {}) => ({ url: "/delivery-notes/invoice-items", params }),
      providesTags: ["DeliveryNote"],
    }),
    getDeliveryNoteInvoices: builder.query({
      query: (params = {}) => ({ url: "/delivery-notes/invoices", params }),
      providesTags: ["DeliveryNote"],
    }),
    createDeliveryNote: builder.mutation({
      query: (payload) => ({ url: "/delivery-notes", method: "POST", body: payload }),
      invalidatesTags: ["DeliveryNote", "Dashboard"],
    }),
    updateDeliveryNote: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/delivery-notes/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "DeliveryNote", id }],
    }),
    deleteDeliveryNote: builder.mutation({
      query: (id) => ({ url: `/delivery-notes/${id}`, method: "DELETE" }),
      invalidatesTags: ["DeliveryNote", "Dashboard"],
    }),
    createDeliveryNoteFromReceipt: builder.mutation({
      query: ({ receiptId, ...additionalData }) => ({
        url: "/delivery-notes/create-from-receipt",
        method: "POST",
        body: { receipt_id: receiptId, ...additionalData },
      }),
      invalidatesTags: ["DeliveryNote", "Receipt", "Dashboard"],
    }),
    startShipping: builder.mutation({
      query: ({ id, ...shippingData }) => ({
        url: `/delivery-notes/${id}/start-shipping`,
        method: "POST",
        body: shippingData,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "DeliveryNote", id }, "DeliveryNote"],
    }),
    updateTracking: builder.mutation({
      query: ({ id, ...trackingData }) => ({
        url: `/delivery-notes/${id}/update-tracking`,
        method: "POST",
        body: trackingData,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "DeliveryNote", id }],
    }),
    markDelivered: builder.mutation({
      query: ({ id, ...deliveryData }) => ({
        url: `/delivery-notes/${id}/mark-delivered`,
        method: "POST",
        body: deliveryData,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "DeliveryNote", id },
        "DeliveryNote",
        "Dashboard",
      ],
    }),
    markCompleted: builder.mutation({
      query: ({ id, ...completionData }) => ({
        url: `/delivery-notes/${id}/mark-completed`,
        method: "POST",
        body: completionData,
      }),
      invalidatesTags: (r, e, { id }) => [
        { type: "DeliveryNote", id },
        "DeliveryNote",
        "Dashboard",
      ],
    }),
    markFailed: builder.mutation({
      query: ({ id, ...failureData }) => ({
        url: `/delivery-notes/${id}/mark-failed`,
        method: "POST",
        body: failureData,
      }),
      invalidatesTags: (r, e, { id }) => [{ type: "DeliveryNote", id }, "DeliveryNote"],
    }),
    getDeliveryTimeline: builder.query({
      query: (id) => `/delivery-notes/${id}/timeline`,
      providesTags: (r, e, id) => [{ type: "DeliveryNote", id }],
    }),
    getCourierCompanies: builder.query({ query: () => "/delivery-notes/courier-companies" }),
    getDeliveryMethods: builder.query({ query: () => "/delivery-notes/delivery-methods" }),
    generateDeliveryNotePDF: builder.mutation({
      query: (id) => ({ url: `/delivery-notes/${id}/generate-pdf`, method: "GET" }),
    }),

    // ===================== CUSTOMERS =====================
    // เดิมคุณมี helper แยก getCustomerDetails — ผมย้ายมาเป็น RTK endpoint
    getCustomerDetails: builder.query({
      query: ({ customerId, params = {} }) => {
        const qs = new URLSearchParams(params).toString();
        const suffix = qs ? `?${qs}` : "";
        return `/customers/${customerId}/details${suffix}`;
      },
      providesTags: (r, e, { customerId }) => [{ type: "Customer", id: customerId }],
    }),

    // ===================== UTILITIES =====================
    getStatuses: builder.query({
      query: (type = "all") => ({ url: "/statuses", params: { type } }),
    }),
    searchCustomers: builder.query({
      query: (query) => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userUuid = userData.user_uuid || "";
        return { url: "/customers/search", params: { q: query, user: userUuid } };
      },
    }),
    getDashboardStats: builder.query({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard"],
    }),
  }),
});

// Hooks export ทั้งหมด
export const {
  // Companies
  useGetCompaniesQuery,
  useGetCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
  // Pricing
  useGetCompletedPricingRequestsQuery,
  useGetPricingRequestAutofillQuery,
  useGetBulkPricingRequestAutofillQuery,
  // Quotations
  useGetQuotationsQuery,
  useGetQuotationQuery,
  useCreateQuotationMutation,
  useCreateQuotationFromPricingMutation,
  useCreateQuotationFromMultiplePricingMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useSubmitQuotationMutation,
  useApproveQuotationMutation,
  useRejectQuotationMutation,
  useSendBackQuotationMutation,
  useRevokeApprovalQuotationMutation,
  useMarkQuotationSentMutation,
  useUploadQuotationEvidenceMutation,
  useUploadQuotationSignaturesMutation,
  useUploadQuotationSampleImagesMutation,
  useUploadQuotationSampleImagesTempMutation,
  useDeleteQuotationSignatureImageMutation,
  useSendQuotationEmailMutation,
  useMarkQuotationCompletedMutation,
  useGenerateQuotationPDFMutation,
  // Invoices
  useGetQuotationsAwaitingInvoiceQuery,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceFromQuotationMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useApproveInvoiceMutation,
  useSubmitInvoiceMutation,
  useSubmitInvoiceAfterDepositMutation,
  useApproveInvoiceAfterDepositMutation,
  useRevertInvoiceToDraftMutation,
  useUpdateInvoiceDepositDisplayOrderMutation,
  useGenerateInvoicePDFMutation,
  useUploadInvoiceEvidenceMutation,
  // Receipts
  useGetReceiptsQuery,
  useGetReceiptQuery,
  useCreateReceiptFromPaymentMutation,
  useUpdateReceiptMutation,
  useApproveReceiptMutation,
  useCalculateVATQuery,
  useUploadPaymentEvidenceMutation,
  useGenerateReceiptPDFMutation,
  // Delivery Notes
  useGetDeliveryNotesQuery,
  useGetDeliveryNoteQuery,
  useGetDeliveryNoteInvoiceItemsQuery,
  useGetDeliveryNoteInvoicesQuery,
  useCreateDeliveryNoteMutation,
  useUpdateDeliveryNoteMutation,
  useDeleteDeliveryNoteMutation,
  useCreateDeliveryNoteFromReceiptMutation,
  useStartShippingMutation,
  useUpdateTrackingMutation,
  useMarkDeliveredMutation,
  useMarkCompletedMutation,
  useMarkFailedMutation,
  useGetDeliveryTimelineQuery,
  useGetCourierCompaniesQuery,
  useGetDeliveryMethodsQuery,
  useGenerateDeliveryNotePDFMutation,
  // Customers
  useGetCustomerDetailsQuery,
  // Utilities
  useGetStatusesQuery,
  useSearchCustomersQuery,
  useGetDashboardStatsQuery,
} = accountingApi;
