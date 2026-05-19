import { useEffect, useRef, useState } from "react";

const INITIAL_FORM_DATA = {
  type: "",
  status: "",
  company_id: "",
  customer_company: "",
  customer_tax_id: "",
  customer_address: "",
  customer_zip_code: "",
  customer_tel_1: "",
  customer_email: "",
  customer_firstname: "",
  customer_lastname: "",
  special_discount_percentage: 0,
  special_discount_amount: 0,
  has_vat: true,
  vat_percentage: 7.0,
  pricing_mode: "net",
  has_withholding_tax: false,
  withholding_tax_percentage: 0,
  withholding_tax_base: "subtotal",
  deposit_percentage: 0,
  deposit_amount: 0,
  deposit_mode: "percentage",
  deposit_display_order: "before",
  due_date: "",
  payment_method: "",
  payment_terms: "",
  document_header_type: "ต้นฉบับ",
};

const normalizeDate = (raw) => {
  if (!raw) return "";
  if (typeof raw === "string" && raw.length >= 10) return raw.substring(0, 10);
  try {
    return new Date(raw).toISOString().substring(0, 10);
  } catch {
    return "";
  }
};

const inferCustomerDataSource = (invoice) => {
  const explicit = invoice.customer_data_source;
  const normalized = explicit === "master_customer" ? "master" : explicit;
  if (normalized === "master" || normalized === "invoice") return normalized;
  const hasOverride =
    invoice.customer_company ||
    invoice.customer_tax_id ||
    invoice.customer_address ||
    invoice.customer_firstname ||
    invoice.customer_lastname;
  return hasOverride ? "invoice" : "master";
};

const inferDiscountType = (invoice) => {
  if ((invoice.special_discount_percentage || 0) > 0) return "percentage";
  if ((invoice.special_discount_amount || 0) > 0) return "amount";
  return "percentage";
};

/**
 * Initialize + sync `formData`, `notes`, `customerDataSource`, `discountTypeState`
 * จาก invoice ที่โหลดมา. Extracted from InvoiceDetailDialog.jsx เพื่อลด shell.
 *
 * - hydrate ทุกครั้งที่ invoice เปลี่ยน
 * - บน customer source: เคารพการ toggle manual ของ user
 *   (track ผ่าน customerSourceManuallySet ref)
 */
export function useInvoiceFormData(invoice) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [notes, setNotes] = useState("");
  const [customerDataSource, setCustomerDataSource] = useState("master");
  const [discountTypeState, setDiscountTypeState] = useState("percentage");

  const customerSourceManuallySet = useRef(false);
  const prevInvoiceIdRef = useRef(null);

  // hydrate notes
  useEffect(() => {
    if (invoice?.notes) setNotes(invoice.notes);
  }, [invoice?.notes]);

  // hydrate form + auto-set data source (เคารพ manual toggle)
  useEffect(() => {
    if (!invoice || Object.keys(invoice).length === 0) return;

    const newInvoiceId = invoice.id;
    const invoiceChanged = prevInvoiceIdRef.current !== newInvoiceId;

    setDiscountTypeState(inferDiscountType(invoice));

    setFormData({
      type: invoice.type || "full_amount",
      status: invoice.status || "draft",
      company_id: invoice.company_id || "",
      customer_company: invoice.customer_company || "",
      customer_tax_id: invoice.customer_tax_id || "",
      customer_address: invoice.customer_address || "",
      customer_zip_code: invoice.customer_zip_code || "",
      customer_tel_1: invoice.customer_tel_1 || "",
      customer_email: invoice.customer_email || "",
      customer_firstname: invoice.customer_firstname || "",
      customer_lastname: invoice.customer_lastname || "",
      special_discount_percentage: invoice.special_discount_percentage || 0,
      special_discount_amount: invoice.special_discount_amount || 0,
      has_vat: invoice.has_vat !== undefined ? invoice.has_vat : true,
      vat_percentage: invoice.vat_percentage || 7.0,
      pricing_mode: invoice.pricing_mode || "net",
      has_withholding_tax: invoice.has_withholding_tax || false,
      withholding_tax_percentage: invoice.withholding_tax_percentage || 0,
      withholding_tax_base: invoice.withholding_tax_base || "subtotal",
      deposit_percentage: invoice.deposit_percentage || 0,
      deposit_amount: invoice.deposit_amount || 0,
      deposit_mode: invoice.deposit_mode || "percentage",
      deposit_display_order: invoice.deposit_display_order || "before",
      due_date: normalizeDate(invoice.due_date),
      payment_method: invoice.payment_method || "",
      payment_terms: invoice.payment_terms || "",
      document_header_type: invoice.document_header_type || "ต้นฉบับ",
    });

    if (invoiceChanged || !customerSourceManuallySet.current) {
      setCustomerDataSource(inferCustomerDataSource(invoice));
    }
    prevInvoiceIdRef.current = newInvoiceId;
  }, [invoice]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const markCustomerSourceManuallySet = () => {
    customerSourceManuallySet.current = true;
  };

  const clearCustomerSourceManualFlag = () => {
    customerSourceManuallySet.current = false;
  };

  return {
    formData,
    setFormData,
    notes,
    setNotes,
    customerDataSource,
    setCustomerDataSource,
    discountTypeState,
    setDiscountTypeState,
    handleFieldChange,
    markCustomerSourceManuallySet,
    clearCustomerSourceManualFlag,
  };
}
