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
        'Dashboard',
        'Company',
    ],
    endpoints: (builder) => ({
        // ===================== COMPANIES (CRUD) =====================

        getCompanies: builder.query({
            query: (params = {}) => ({
                url: '/companies',
                params,
            }),
            providesTags: (result) => {
                // Tag list + individual for cache granularity
                const items = (result?.data ?? result ?? []).map?.(c => ({ type: 'Company', id: c.id })) || [];
                return [{ type: 'Company', id: 'LIST' }, ...items];
            },
            keepUnusedDataFor: 60,
        }),

        getCompany: builder.query({
            query: (id) => `/companies/${id}`,
            providesTags: (result, error, id) => [{ type: 'Company', id }],
        }),

        createCompany: builder.mutation({
            query: (data) => ({
                url: '/companies',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Company', id: 'LIST' }],
        }),

        updateCompany: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/companies/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Company', id },
                { type: 'Company', id: 'LIST' },
            ],
        }),

        deleteCompany: builder.mutation({
            query: (id) => ({
                url: `/companies/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Company', id: 'LIST' }],
        }),

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
                    primary_pricing_request_ids: pricingRequestIds, // ⭐ รองรับ multiple primary IDs
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

        // Submit quotation for review
        submitQuotation: builder.mutation({
            query: (id) => ({
                url: `/quotations/${id}/submit`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Quotation', id },
                'Quotation',
                'Dashboard',
            ],
        }),

        // Reject quotation (Account)
        rejectQuotation: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/quotations/${id}/reject`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
                'Quotation',
                'Dashboard',
            ],
        }),

        // Send back for editing (Account)
        sendBackQuotation: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/quotations/${id}/send-back`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
                'Quotation',
            ],
        }),

        // Revoke approval (Account)
        revokeApprovalQuotation: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/quotations/${id}/revoke-approval`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
                'Quotation',
                'Dashboard',
            ],
        }),

        // Mark as sent (Sales)
        markQuotationSent: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/quotations/${id}/mark-sent`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
                'Quotation',
            ],
        }),

        // Upload evidence
        uploadQuotationEvidence: builder.mutation({
            query: ({ id, files, description }) => {
                const formData = new FormData();
                if (Array.isArray(files)) {
                    files.forEach((f) => formData.append('files[]', f));
                } else if (files) {
                    formData.append('files[]', files);
                }
                if (description) formData.append('description', description);
                return {
                    url: `/quotations/${id}/upload-evidence`,
                    method: 'POST',
                    body: formData,
                    headers: { 'X-Skip-Json': '1' },
                    formData: true,
                };
            },
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
            ],
        }),

        // Upload signature images (approved quotations)
        uploadQuotationSignatures: builder.mutation({
            query: ({ id, files }) => {
                const formData = new FormData();
                if (Array.isArray(files)) {
                    files.forEach(f => formData.append('files[]', f));
                } else if (files) {
                    formData.append('files[]', files);
                }
                return {
                    url: `/quotations/${id}/upload-signatures`,
                    method: 'POST',
                    body: formData,
                    headers: { 'X-Skip-Json': '1' },
                    formData: true,
                };
            },
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
            ],
        }),

        // Send quotation email
        sendQuotationEmail: builder.mutation({
            query: ({ id, ...emailData }) => ({
                url: `/quotations/${id}/send-email`,
                method: 'POST',
                body: emailData,
            }),
        }),

        // Mark as completed (Sales)
        markQuotationCompleted: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/quotations/${id}/mark-completed`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Quotation', id },
                'Quotation',
                'Dashboard',
            ],
        }),

        // Generate PDF (mPDF-first with fallback). Accepts id or { id, format, orientation, showWatermark }
        generateQuotationPDF: builder.mutation({
            query: (arg) => {
                const isScalar = typeof arg === 'string' || typeof arg === 'number';
                const id = isScalar ? arg : arg?.id;
                const body = isScalar ? {} : {
                    format: arg?.format,
                    orientation: arg?.orientation,
                    showWatermark: arg?.showWatermark,
                };
                return {
                    url: `/quotations/${id}/generate-pdf`,
                    method: 'POST',
                    body,
                };
            },
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
    // Companies
    useGetCompaniesQuery,
    useGetCompanyQuery,
    useCreateCompanyMutation,
    useUpdateCompanyMutation,
    useDeleteCompanyMutation,
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
    useSubmitQuotationMutation,
    useApproveQuotationMutation,
    useRejectQuotationMutation,
    useSendBackQuotationMutation,
    useRevokeApprovalQuotationMutation,
    useMarkQuotationSentMutation,
    useUploadQuotationEvidenceMutation,
    useUploadQuotationSignaturesMutation,
    useSendQuotationEmailMutation,
    useMarkQuotationCompletedMutation,
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

class AccountingAPI {
    constructor() {
        this.baseURL = `${apiConfig.baseUrl}`;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = new Headers();
        apiConfig.prepareHeaders(headers);

        const config = {
            method: options.method || "GET",
            headers,
            credentials: apiConfig.credentials,
            body: options.body,
        };

        const res = await fetch(url, config);
        const isJson = (res.headers.get("content-type") || "").includes("application/json");
        const data = isJson ? await res.json().catch(() => ({})) : await res.text();
        if (!res.ok) {
            const message = data?.message || `${res.status} ${res.statusText}`;
            const err = new Error(message);
            err.response = { status: res.status, data };
            throw err;
        }
        return data;
    }

    // Customer helper for full details (used by Pricing Integration forms)
    getCustomerDetails(customerId, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const suffix = qs ? `?${qs}` : "";
        return this.request(`/customers/${customerId}/details${suffix}`);
    }
}

const accountingHttp = new AccountingAPI();
export default accountingHttp;
