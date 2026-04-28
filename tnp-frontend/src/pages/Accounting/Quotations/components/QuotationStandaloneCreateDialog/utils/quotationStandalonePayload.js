// Pure payload builder for QuotationStandaloneCreateDialog submit flow.
// No side-effects, no hooks, no API calls.
import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";

// Flatten standalone-form jobs into the API items shape (each sizeRow → 1 item).
// Standalone job shape differs from Phase 4's group shape (camelCase keys, snake_case
// row keys), so we cannot reuse `buildQuotationItems` directly.
export function buildStandaloneItems(jobs = []) {
  return jobs.flatMap((job) =>
    (job.sizeRows || []).map((row) => ({
      item_name: job.work_name,
      item_description: "",
      pattern: job.pattern,
      fabric_type: job.fabric_type,
      color: job.color,
      size: row.size,
      unit_price: row.unit_price,
      quantity: row.quantity,
      unit: job.unit,
      discount_percentage: 0,
      discount_amount: 0,
      notes: row.notes,
      // sequence_order intentionally omitted — backend assigns 1..N
    }))
  );
}

const isCreditTerm = (type) => type === PAYMENT_TERMS.CREDIT_30 || type === PAYMENT_TERMS.CREDIT_60;

const resolvePaymentTerms = (formData) =>
  formData.payment_terms === PAYMENT_TERMS.OTHER
    ? formData.payment_terms_custom
    : formData.payment_terms;

const resolveDueDate = (formData) =>
  isCreditTerm(formData.payment_terms) ? formData.due_date : "";

// Build the create-standalone-quotation payload from form state.
export function buildStandaloneQuotationPayload(formData, financials) {
  return {
    company_id: formData.company_id,
    customer_id: formData.customer_id,
    work_name: formData.jobs.map((j) => j.work_name).join(", "),
    payment_terms: resolvePaymentTerms(formData),
    due_date: resolveDueDate(formData),
    notes: formData.notes,
    document_header_type: formData.document_header_type,
    items: buildStandaloneItems(formData.jobs),
    ...financials,
    customer_details: {
      cus_company: formData.customer_company,
      cus_tel_1: formData.customer_phone,
      customer_type: formData.customer_type,
      cus_firstname: formData.contact_firstname,
      cus_lastname: formData.contact_lastname,
      cus_name: formData.contact_nickname,
      cus_depart: formData.contact_position,
      cus_tel_2: formData.contact_phone_alt,
      cus_email: formData.customer_email,
      cus_tax_id: formData.customer_tax_id,
      cus_address: formData.customer_address,
      cus_zip_code: formData.customer_zip_code,
    },
  };
}
