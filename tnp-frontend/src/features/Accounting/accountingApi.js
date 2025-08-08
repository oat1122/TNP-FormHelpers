import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiConfig } from "../../api/apiConfig";

export const accountingApi = createApi({
    reducerPath: "accountingApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${apiConfig.baseUrl}`,
        prepareHeaders: apiConfig.prepareHeaders,
        credentials: apiConfig.credentials,
    }),
    tagTypes: [
        'PricingRequest',
        'Quotation',
        'Invoice',
        'Receipt',
        'DeliveryNote',
        'Dashboard'
    ],
    endpoints: (builder) => ({

        // ===================== PRICING REQUESTS =====================

        getCompletedPricingRequests: builder.query({
            query: (params = {}) => {
                // 🔐 เพิ่ม user parameter สำหรับ access control
                const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                const userUuid = userData.user_uuid || "";
                
                return {
                    url: '/pricing-requests',
                    params: {
                        status: 'complete',
                        page: params.page || 1,
                        per_page: params.per_page || 20,
                        user: userUuid, // 🔐 ส่ง user uuid สำหรับ access control
                        ...params
                    },
                };
            },
            providesTags: ['PricingRequest'],
            // Keep previous data while fetching new data for better UX
            keepUnusedDataFor: 60, // 1 minute
        }),

        getPricingRequestAutofill: builder.query({
            query: (id) => `/pricing-requests/${id}/autofill`,
            providesTags: (result, error, id) => [{ type: 'PricingRequest', id }],
        }),

        // ===================== QUOTATIONS =====================

        getQuotations: builder.query({
            query: (params = {}) => ({
                url: '/quotations',
                params,
            }),
            providesTags: ['Quotation'],
        }),

        getQuotation: builder.query({
            query: (id) => `/quotations/${id}`,
            providesTags: (result, error, id) => [{ type: 'Quotation', id }],
        }),

        createQuotation: builder.mutation({
            query: (data) => ({
                url: '/quotations',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Quotation', 'Dashboard'],
        }),

        createQuotationFromPricing: builder.mutation({
            query: ({ pricingRequestId, ...additionalData }) => ({
                url: '/quotations/create-from-pricing',
                method: 'POST',
                body: {
                    pricing_request_id: pricingRequestId,
                    ...additionalData,
                },
            }),
            invalidatesTags: ['Quotation', 'PricingRequest', 'Dashboard'],
        }),

        createQuotationFromMultiplePricing: builder.mutation({
            query: ({ pricingRequestIds, customerId, ...additionalData }) => ({
                url: '/quotations/create-from-multiple-pricing',
                method: 'POST',
                body: {
                    pricing_request_ids: pricingRequestIds,
                    customer_id: customerId,
                    ...additionalData,
                },
            }),
            invalidatesTags: ['Quotation', 'PricingRequest', 'Dashboard'],
        }),

        updateQuotation: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/quotations/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
                'Quotation',
                'Dashboard'
            ],
        }),

        deleteQuotation: builder.mutation({
            query: (id) => ({
                url: `/quotations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Quotation', 'Dashboard'],
        }),

        approveQuotation: builder.mutation({
            query: ({ id, ...approvalData }) => ({
                url: `/quotations/${id}/approve`,
                method: 'POST',
                body: approvalData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
                'Quotation',
                'Dashboard'
            ],
        }),

        generateQuotationPDF: builder.mutation({
            query: (id) => ({
                url: `/quotations/${id}/generate-pdf`,
                method: 'GET',
            }),
        }),

        // ===================== INVOICES =====================

        getInvoices: builder.query({
            query: (params = {}) => ({
                url: '/invoices',
                params,
            }),
            providesTags: ['Invoice'],
        }),

        getInvoice: builder.query({
            query: (id) => `/invoices/${id}`,
            providesTags: (result, error, id) => [{ type: 'Invoice', id }],
        }),

        createInvoiceFromQuotation: builder.mutation({
            query: ({ quotationId, ...additionalData }) => ({
                url: '/invoices/create-from-quotation',
                method: 'POST',
                body: {
                    quotation_id: quotationId,
                    ...additionalData,
                },
            }),
            invalidatesTags: ['Invoice', 'Quotation', 'Dashboard'],
        }),

        updateInvoice: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/invoices/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Invoice', id },
                'Invoice',
                'Dashboard'
            ],
        }),

        deleteInvoice: builder.mutation({
            query: (id) => ({
                url: `/invoices/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Invoice', 'Dashboard'],
        }),

        approveInvoice: builder.mutation({
            query: ({ id, ...approvalData }) => ({
                url: `/invoices/${id}/approve`,
                method: 'POST',
                body: approvalData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Invoice', id },
                'Invoice',
                'Dashboard'
            ],
        }),

        generateInvoicePDF: builder.mutation({
            query: (id) => ({
                url: `/invoices/${id}/generate-pdf`,
                method: 'GET',
            }),
        }),

        // ===================== RECEIPTS =====================

        getReceipts: builder.query({
            query: (params = {}) => ({
                url: '/receipts',
                params,
            }),
            providesTags: ['Receipt'],
        }),

        getReceipt: builder.query({
            query: (id) => `/receipts/${id}`,
            providesTags: (result, error, id) => [{ type: 'Receipt', id }],
        }),

        createReceiptFromPayment: builder.mutation({
            query: ({ invoiceId, ...paymentData }) => ({
                url: '/receipts/create-from-payment',
                method: 'POST',
                body: {
                    invoice_id: invoiceId,
                    ...paymentData,
                },
            }),
            invalidatesTags: ['Receipt', 'Invoice', 'Dashboard'],
        }),

        updateReceipt: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/receipts/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Receipt', id },
                'Receipt',
                'Dashboard'
            ],
        }),

        approveReceipt: builder.mutation({
            query: ({ id, ...approvalData }) => ({
                url: `/receipts/${id}/approve`,
                method: 'POST',
                body: approvalData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Receipt', id },
                'Receipt',
                'Dashboard'
            ],
        }),

        calculateVAT: builder.query({
            query: ({ amount, vatType = 'exclude' }) => ({
                url: '/receipts/calculate-vat',
                params: { amount, vat_type: vatType },
            }),
        }),

        uploadPaymentEvidence: builder.mutation({
            query: ({ receiptId, fileData }) => {
                const formData = new FormData();
                formData.append('evidence_file', fileData);

                return {
                    url: `/receipts/${receiptId}/upload-evidence`,
                    method: 'POST',
                    body: formData,
                    formData: true,
                };
            },
            invalidatesTags: (result, error, { receiptId }) => [
                { type: 'Receipt', id: receiptId },
            ],
        }),

        generateReceiptPDF: builder.mutation({
            query: (id) => ({
                url: `/receipts/${id}/generate-pdf`,
                method: 'GET',
            }),
        }),

        // ===================== DELIVERY NOTES =====================

        getDeliveryNotes: builder.query({
            query: (params = {}) => ({
                url: '/delivery-notes',
                params,
            }),
            providesTags: ['DeliveryNote'],
        }),

        getDeliveryNote: builder.query({
            query: (id) => `/delivery-notes/${id}`,
            providesTags: (result, error, id) => [{ type: 'DeliveryNote', id }],
        }),

        createDeliveryNoteFromReceipt: builder.mutation({
            query: ({ receiptId, ...additionalData }) => ({
                url: '/delivery-notes/create-from-receipt',
                method: 'POST',
                body: {
                    receipt_id: receiptId,
                    ...additionalData,
                },
            }),
            invalidatesTags: ['DeliveryNote', 'Receipt', 'Dashboard'],
        }),

        startShipping: builder.mutation({
            query: ({ id, ...shippingData }) => ({
                url: `/delivery-notes/${id}/start-shipping`,
                method: 'POST',
                body: shippingData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'DeliveryNote', id },
                'DeliveryNote',
            ],
        }),

        updateTracking: builder.mutation({
            query: ({ id, ...trackingData }) => ({
                url: `/delivery-notes/${id}/update-tracking`,
                method: 'POST',
                body: trackingData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'DeliveryNote', id },
            ],
        }),

        markDelivered: builder.mutation({
            query: ({ id, ...deliveryData }) => ({
                url: `/delivery-notes/${id}/mark-delivered`,
                method: 'POST',
                body: deliveryData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'DeliveryNote', id },
                'DeliveryNote',
                'Dashboard'
            ],
        }),

        markCompleted: builder.mutation({
            query: ({ id, ...completionData }) => ({
                url: `/delivery-notes/${id}/mark-completed`,
                method: 'POST',
                body: completionData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'DeliveryNote', id },
                'DeliveryNote',
                'Dashboard'
            ],
        }),

        markFailed: builder.mutation({
            query: ({ id, ...failureData }) => ({
                url: `/delivery-notes/${id}/mark-failed`,
                method: 'POST',
                body: failureData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'DeliveryNote', id },
                'DeliveryNote',
            ],
        }),

        getDeliveryTimeline: builder.query({
            query: (id) => `/delivery-notes/${id}/timeline`,
            providesTags: (result, error, id) => [{ type: 'DeliveryNote', id }],
        }),

        getCourierCompanies: builder.query({
            query: () => '/delivery-notes/courier-companies',
        }),

        getDeliveryMethods: builder.query({
            query: () => '/delivery-notes/delivery-methods',
        }),

        generateDeliveryNotePDF: builder.mutation({
            query: (id) => ({
                url: `/delivery-notes/${id}/generate-pdf`,
                method: 'GET',
            }),
        }),

        // ===================== UTILITY METHODS =====================

        getStatuses: builder.query({
            query: (type = 'all') => ({
                url: '/statuses',
                params: { type },
            }),
        }),

        searchCustomers: builder.query({
            query: (query) => {
                // 🔐 เพิ่ม user parameter สำหรับ access control
                const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                const userUuid = userData.user_uuid || "";
                
                return {
                    url: '/customers/search',
                    params: { 
                        q: query,
                        user: userUuid // 🔐 ส่ง user uuid สำหรับ access control
                    },
                };
            },
        }),

        getDashboardStats: builder.query({
            query: () => '/dashboard/stats',
            providesTags: ['Dashboard'],
        }),
    }),
});

// Export hooks for usage in functional components
export const {
    // Pricing Requests
    useGetCompletedPricingRequestsQuery,
    useGetPricingRequestAutofillQuery,

    // Quotations
    useGetQuotationsQuery,
    useGetQuotationQuery,
    useCreateQuotationMutation,
    useCreateQuotationFromPricingMutation,
    useCreateQuotationFromMultiplePricingMutation,
    useUpdateQuotationMutation,
    useDeleteQuotationMutation,
    useApproveQuotationMutation,
    useGenerateQuotationPDFMutation,

    // Invoices
    useGetInvoicesQuery,
    useGetInvoiceQuery,
    useCreateInvoiceFromQuotationMutation,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation,
    useApproveInvoiceMutation,
    useGenerateInvoicePDFMutation,

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

    // Utilities
    useGetStatusesQuery,
    useSearchCustomersQuery,
    useGetDashboardStatsQuery,
} = accountingApi;
