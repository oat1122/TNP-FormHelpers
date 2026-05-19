/**
 * Hook สร้าง handler radio "customerDataSource" (master | invoice).
 *  - บน "master": ไม่แตะ formData (override จะถูก clear ใน payload ตอน save)
 *  - บน "invoice": autofill จาก master ไปยัง override fields เฉพาะที่ยังว่าง
 *
 * Extracted from InvoiceDetailDialog.jsx (~30 บรรทัดของ handler).
 */
export function useCustomerSourceToggle({
  setFormData,
  setCustomerDataSource,
  markCustomerSourceManuallySet,
  customer,
}) {
  const handleCustomerDataSourceChange = (_event, value) => {
    const newSource = value;
    if (!newSource) return;
    markCustomerSourceManuallySet();
    setCustomerDataSource(newSource);
    if (newSource === "master") return;
    if (newSource === "invoice" && customer) {
      setFormData((prev) => ({
        ...prev,
        customer_company: prev.customer_company || customer.cus_company || "",
        customer_tax_id: prev.customer_tax_id || customer.cus_tax_id || "",
        customer_address: prev.customer_address || customer.cus_address || "",
        customer_zip_code: prev.customer_zip_code || customer.cus_zip_code || "",
        customer_tel_1: prev.customer_tel_1 || customer.cus_tel_1 || "",
        customer_email: prev.customer_email || customer.cus_email || "",
        customer_firstname: prev.customer_firstname || customer.cus_firstname || "",
        customer_lastname: prev.customer_lastname || customer.cus_lastname || "",
      }));
    }
  };

  return { handleCustomerDataSourceChange };
}
