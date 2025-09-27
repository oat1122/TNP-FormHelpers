import { apiConfig } from "./apiConfig";

class AccountingAPI {
  constructor() {
    this.baseURL = `${apiConfig.baseUrl}`;
  }

  // Helper method for making API calls
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = new Headers();
    apiConfig.prepareHeaders(headers);

    const config = {
      headers: Object.fromEntries(headers),
      credentials: apiConfig.credentials,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // ===================== PRICING REQUESTS =====================

  /**
   * ดึงรายการ Pricing Request ที่สถานะ Complete
   */
  async getCompletedPricingRequests(params = {}) {
    const queryParams = new URLSearchParams({
      status: "complete",
      ...params,
    });
    return this.makeRequest(`/pricing-requests?${queryParams}`);
  }

  /**
   * ดึงข้อมูล Auto-fill จาก Pricing Request
   */
  async getPricingRequestAutofill(pricingRequestId) {
    return this.makeRequest(`/pricing-requests/${pricingRequestId}/autofill`);
  }

  // ===================== QUOTATIONS =====================

  /**
   * ดึงรายการใบเสนอราคา
   */
  async getQuotations(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest(`/quotations?${queryParams}`);
  }

  /**
   * ดึงรายละเอียดใบเสนอราคา
   */
  async getQuotation(id) {
    return this.makeRequest(`/quotations/${id}`);
  }

  /**
   * สร้างใบเสนอราคาใหม่
   */
  async createQuotation(data) {
    // Normalize payload to backend expectations
    const payload = {
      company_id: data.company_id,
      pricing_request_id: data.pricing_request_id,
      customer_company: data.customer?.cus_company || data.customer_company,
      work_name: data.work_name || (data.items?.[0]?.name ?? ""),
      subtotal: data.subtotal,
      tax_amount: data.vat ?? data.tax_amount,
      special_discount_percentage:
        data.specialDiscountType === "percentage" ? data.specialDiscountValue : 0,
      special_discount_amount:
        data.specialDiscountType === "amount"
          ? data.specialDiscountValue
          : data.specialDiscountAmount,
      has_withholding_tax: data.hasWithholdingTax || false,
      withholding_tax_percentage: data.withholdingTaxPercentage || 0,
      withholding_tax_amount: data.withholdingTaxAmount || 0,
      total_amount: data.total,
      deposit_percentage: data.depositPercentage ?? data.deposit_percentage,
      payment_terms: data.paymentMethod ?? data.payment_terms,
      due_date: data.dueDate ?? data.due_date,
      notes: data.notes,
      // total already reflects (subtotal - discount) + VAT; only subtract withholding for final
      final_total_amount: data.finalTotal || data.total - (data.withholdingTaxAmount || 0),
      // Optional items
      items: (data.items || []).map((it, idx) => ({
        pricing_request_id: it.pricingRequestId || it.pr_id || it.pricing_request_id,
        item_name: it.name,
        item_description: it.item_description || null,
        sequence_order: it.sequence_order ?? idx + 1,
        pattern: it.pattern || null,
        fabric_type: it.fabricType || it.fabric_type || null,
        color: it.color || null,
        size: it.size || null,
        unit_price: it.unitPrice ?? it.unit_price ?? 0,
        quantity: it.quantity ?? 0,
        unit: it.unit ?? "",
        discount_percentage: it.discount_percentage ?? 0,
        discount_amount: it.discount_amount ?? 0,
        notes: it.notes || null,
      })),
    };
    return this.makeRequest("/quotations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * สร้างใบเสนอราคาจาก Pricing Request
   */
  async createQuotationFromPricing(pricingRequestId, additionalData = {}) {
    return this.makeRequest("/quotations/create-from-pricing", {
      method: "POST",
      body: JSON.stringify({
        pricing_request_id: pricingRequestId,
        ...additionalData,
      }),
    });
  }

  /**
   * สร้างใบเสนอราคาจาก Multiple Pricing Requests
   * รองรับ primary_pricing_request_ids แบบ array
   */
  async createQuotationFromMultiplePricing(data) {
    const payload = {
      pricing_request_ids: data.pricingRequestIds,
      customer_id: data.customerId,
      primary_pricing_request_ids: data.pricingRequestIds,
      additional_notes: data.additional_notes,
      subtotal: data.subtotal,
      tax_amount: data.vat ?? data.tax_amount,
      total_amount: data.total ?? data.total_amount,
      // ⭐ Extended financial fields passthrough
      special_discount_percentage:
        data.special_discount_percentage ??
        data.specialDiscountPercentage ??
        (data.specialDiscountType === "percentage" ? data.specialDiscountValue : 0),
      special_discount_amount:
        data.special_discount_amount ??
        data.specialDiscountAmount ??
        (data.specialDiscountType === "amount" ? data.specialDiscountValue : 0),
      has_withholding_tax: data.has_withholding_tax ?? data.hasWithholdingTax ?? false,
      withholding_tax_percentage:
        data.withholding_tax_percentage ?? data.withholdingTaxPercentage ?? 0,
      withholding_tax_amount: data.withholding_tax_amount ?? data.withholdingTaxAmount ?? 0,
      final_total_amount:
        data.final_total_amount ??
        data.finalTotal ??
        (data.total ?? 0) - (data.withholdingTaxAmount || 0),
      deposit_percentage: data.depositPercentage ?? data.deposit_percentage,
      payment_terms: data.paymentMethod ?? data.payment_terms,
      items: (data.items || []).map((it, idx) => ({
        pricing_request_id: it.pricingRequestId || it.pr_id || it.pricing_request_id,
        item_name: it.name,
        item_description: it.item_description || null,
        sequence_order: it.sequence_order ?? idx + 1,
        pattern: it.pattern || null,
        fabric_type: it.fabricType || it.fabric_type || null,
        color: it.color || null,
        size: it.size || null,
        unit_price: it.unitPrice ?? it.unit_price ?? 0,
        quantity: it.quantity ?? 0,
        unit: it.unit ?? "",
        discount_percentage: it.discount_percentage ?? 0,
        discount_amount: it.discount_amount ?? 0,
        notes: it.notes || null,
      })),
    };
    return this.makeRequest("/quotations/create-from-multiple-pricing", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * อัปเดตใบเสนอราคา
   */
  async updateQuotation(id, data) {
    return this.makeRequest(`/quotations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * ลบใบเสนอราคา
   */
  async deleteQuotation(id) {
    return this.makeRequest(`/quotations/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * อนุมัติใบเสนอราคา
   */
  async approveQuotation(id, approvalData = {}) {
    return this.makeRequest(`/quotations/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(approvalData),
    });
  }

  /**
   * สร้าง PDF ใบเสนอราคา (mPDF-first)
   */
  async generateQuotationPDF(id, options = {}) {
    return this.makeRequest(`/quotations/${id}/generate-pdf`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  }

  // ===================== INVOICES =====================

  /**
   * ดึงรายการใบแจ้งหนี้
   */
  async getInvoices(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest(`/invoices?${queryParams}`);
  }

  /**
   * ดึงรายละเอียดใบแจ้งหนี้
   */
  async getInvoice(id) {
    return this.makeRequest(`/invoices/${id}`);
  }

  /**
   * สร้างใบแจ้งหนี้จากใบเสนอราคา
   */
  async createInvoiceFromQuotation(quotationId, additionalData = {}) {
    return this.makeRequest("/invoices/create-from-quotation", {
      method: "POST",
      body: JSON.stringify({
        quotation_id: quotationId,
        ...additionalData,
      }),
    });
  }

  /**
   * อัปเดตใบแจ้งหนี้
   */
  async updateInvoice(id, data) {
    return this.makeRequest(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * ลบใบแจ้งหนี้
   */
  async deleteInvoice(id) {
    return this.makeRequest(`/invoices/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * อนุมัติใบแจ้งหนี้
   */
  async approveInvoice(id, approvalData = {}) {
    return this.makeRequest(`/invoices/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(approvalData),
    });
  }

  /**
   * ส่งใบแจ้งหนี้ขออนุมัติ (draft -> pending)
   */
  async submitInvoice(id) {
    return this.makeRequest(`/invoices/${id}/submit`, {
      method: "POST",
    });
  }

  /**
   * สร้าง PDF ใบแจ้งหนี้
   */
  async generateInvoicePDF(id) {
    return this.makeRequest(`/invoices/${id}/generate-pdf`);
  }

  // ===================== RECEIPTS =====================

  /**
   * ดึงรายการใบเสร็จรับเงิน
   */
  async getReceipts(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest(`/receipts?${queryParams}`);
  }

  /**
   * ดึงรายละเอียดใบเสร็จรับเงิน
   */
  async getReceipt(id) {
    return this.makeRequest(`/receipts/${id}`);
  }

  /**
   * สร้างใบเสร็จจากการชำระเงิน
   */
  async createReceiptFromPayment(invoiceId, paymentData) {
    return this.makeRequest("/receipts/create-from-payment", {
      method: "POST",
      body: JSON.stringify({
        invoice_id: invoiceId,
        ...paymentData,
      }),
    });
  }

  /**
   * อัปเดตใบเสร็จ
   */
  async updateReceipt(id, data) {
    return this.makeRequest(`/receipts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * อนุมัติใบเสร็จ
   */
  async approveReceipt(id, approvalData = {}) {
    return this.makeRequest(`/receipts/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(approvalData),
    });
  }

  /**
   * คำนวณ VAT
   */
  async calculateVAT(amount, vatType = "exclude") {
    return this.makeRequest("/receipts/calculate-vat", {
      method: "GET",
      body: JSON.stringify({ amount, vat_type: vatType }),
    });
  }

  /**
   * อัปโหลดหลักฐานการชำระเงิน
   */
  async uploadPaymentEvidence(receiptId, fileData) {
    const formData = new FormData();
    formData.append("evidence_file", fileData);

    const headers = new Headers();
    apiConfig.prepareHeaders(headers);
    headers.delete("Content-Type"); // Let browser set content-type for FormData

    return this.makeRequest(`/receipts/${receiptId}/upload-evidence`, {
      method: "POST",
      headers: Object.fromEntries(headers),
      body: formData,
    });
  }

  /**
   * สร้าง PDF ใบเสร็จ
   */
  async generateReceiptPDF(id) {
    return this.makeRequest(`/receipts/${id}/generate-pdf`);
  }

  // ===================== COMPANIES (CRUD) =====================

  async getCompanies(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.makeRequest(`/companies${query ? `?${query}` : ""}`);
  }

  async getCompany(id) {
    return this.makeRequest(`/companies/${id}`);
  }

  async createCompany(data) {
    return this.makeRequest("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id, data) {
    return this.makeRequest(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id) {
    return this.makeRequest(`/companies/${id}`, {
      method: "DELETE",
    });
  }

  // ===================== DELIVERY NOTES =====================

  /**
   * ดึงรายการใบส่งของ
   */
  async getDeliveryNotes(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.makeRequest(`/delivery-notes?${queryParams}`);
  }

  /**
   * ดึงรายละเอียดใบส่งของ
   */
  async getDeliveryNote(id) {
    return this.makeRequest(`/delivery-notes/${id}`);
  }

  /**
   * สร้างใบส่งของจากใบเสร็จ
   */
  async createDeliveryNoteFromReceipt(receiptId, additionalData = {}) {
    return this.makeRequest("/delivery-notes/create-from-receipt", {
      method: "POST",
      body: JSON.stringify({
        receipt_id: receiptId,
        ...additionalData,
      }),
    });
  }

  /**
   * เริ่มการจัดส่ง
   */
  async startShipping(id, shippingData) {
    return this.makeRequest(`/delivery-notes/${id}/start-shipping`, {
      method: "POST",
      body: JSON.stringify(shippingData),
    });
  }

  /**
   * อัปเดตสถานะการติดตาม
   */
  async updateTracking(id, trackingData) {
    return this.makeRequest(`/delivery-notes/${id}/update-tracking`, {
      method: "POST",
      body: JSON.stringify(trackingData),
    });
  }

  /**
   * ยืนยันส่งสำเร็จ
   */
  async markDelivered(id, deliveryData = {}) {
    return this.makeRequest(`/delivery-notes/${id}/mark-delivered`, {
      method: "POST",
      body: JSON.stringify(deliveryData),
    });
  }

  /**
   * ปิดงาน
   */
  async markCompleted(id, completionData = {}) {
    return this.makeRequest(`/delivery-notes/${id}/mark-completed`, {
      method: "POST",
      body: JSON.stringify(completionData),
    });
  }

  /**
   * รายงานปัญหา
   */
  async markFailed(id, failureData) {
    return this.makeRequest(`/delivery-notes/${id}/mark-failed`, {
      method: "POST",
      body: JSON.stringify(failureData),
    });
  }

  /**
   * ดูไทม์ไลน์การส่ง
   */
  async getDeliveryTimeline(id) {
    return this.makeRequest(`/delivery-notes/${id}/timeline`);
  }

  /**
   * ดึงรายการบริษัทขนส่ง
   */
  async getCourierCompanies() {
    return this.makeRequest("/delivery-notes/courier-companies");
  }

  /**
   * ดึงวิธีการส่ง
   */
  async getDeliveryMethods() {
    return this.makeRequest("/delivery-notes/delivery-methods");
  }

  /**
   * สร้าง PDF ใบส่งของ
   */
  async generateDeliveryNotePDF(id) {
    return this.makeRequest(`/delivery-notes/${id}/generate-pdf`);
  }

  // ===================== UTILITY METHODS =====================

  /**
   * ดึงข้อมูลสถานะทั้งหมด
   */
  async getStatuses(type = "all") {
    return this.makeRequest(`/statuses?type=${type}`);
  }

  /**
   * ดึงข้อมูลลูกค้าสำหรับ Auto-complete
   */
  async searchCustomers(query) {
    return this.makeRequest(`/customers/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * ดึงข้อมูลสำหรับ Dashboard
   */
  async getDashboardStats() {
    return this.makeRequest("/dashboard/stats");
  }
}

// Create singleton instance
const accountingApi = new AccountingAPI();

export default accountingApi;
