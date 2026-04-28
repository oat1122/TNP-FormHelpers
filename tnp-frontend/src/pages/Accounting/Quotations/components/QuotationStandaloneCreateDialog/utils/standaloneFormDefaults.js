import { PAYMENT_TERMS } from "../../../../shared/constants/paymentTerms";

export const DEFAULT_NOTES = `**ไม่สามารถหักภาษี ณ ที่จ่ายได้ เนื่องจากเป็นการซื้อมาขายไป**
มัดจำ50%ก่อนเริ่มงาน ชำระ50%ส่วนหลังก่อนส่งสินค้า`;

export const emptyFormData = {
  company_id: "",
  customer_id: "",
  payment_terms: PAYMENT_TERMS.CASH,
  payment_terms_custom: "",
  due_date: "",
  notes: DEFAULT_NOTES,
  document_header_type: "ต้นฉบับ",
  jobs: [],
  customer_company: "",
  customer_phone: "",
  customer_type: "individual",
  contact_firstname: "",
  contact_lastname: "",
  contact_nickname: "",
  contact_position: "",
  contact_phone_alt: "",
  customer_email: "",
  customer_tax_id: "",
  customer_channel: "1",
  customer_business_type_id: "",
  customer_sales_user_id: "",
  customer_address: "",
  customer_province_id: "",
  customer_district_id: "",
  customer_subdistrict_id: "",
  customer_zip_code: "",
};

export const emptyFinancials = {
  special_discount_percentage: 0,
  special_discount_amount: 0,
  has_vat: true,
  vat_percentage: 7,
  pricing_mode: "net",
  has_withholding_tax: false,
  withholding_tax_percentage: 0,
  deposit_mode: "percentage",
  deposit_percentage: 50,
  deposit_amount: 0,
};

export const STEP_LABELS = ["ข้อมูลลูกค้า", "ข้อมูลใบเสนอราคา", "การคำนวณทางการเงิน(สรุปรวม)"];
