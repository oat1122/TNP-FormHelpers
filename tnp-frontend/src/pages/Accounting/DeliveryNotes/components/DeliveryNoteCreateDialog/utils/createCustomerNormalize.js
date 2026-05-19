/**
 * แปลง master_customers relation ของ invoice → flat customer object
 * ที่ section ของ DeliveryNoteCreateDialog อ่านได้ง่าย.
 *
 * Extracted from DeliveryNoteCreateDialog.jsx (~25 บรรทัด inline ใน shell).
 * คืน {} เมื่อไม่มี invoice หรือไม่มี customer.
 */
export const normalizeInvoiceCustomer = (invoice) => {
  if (!invoice) return {};
  const customer = invoice.customer;
  if (!customer) return {};

  const contactName =
    customer.cus_firstname && customer.cus_lastname
      ? `${customer.cus_firstname} ${customer.cus_lastname}`.trim()
      : customer.cus_name;

  return {
    customer_type: customer.cus_company ? "company" : "individual",
    cus_name: customer.cus_name,
    cus_firstname: customer.cus_firstname,
    cus_lastname: customer.cus_lastname,
    cus_company: customer.cus_company,
    cus_tel_1: customer.cus_tel_1,
    cus_tel_2: customer.cus_tel_2,
    cus_email: customer.cus_email,
    cus_tax_id: customer.cus_tax_id,
    cus_address: customer.cus_address,
    cus_zip_code: customer.cus_zip_code,
    cus_depart: customer.cus_depart,
    contact_name: contactName,
    contact_nickname: customer.cus_name,
  };
};
