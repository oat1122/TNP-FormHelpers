import { useState, useEffect } from "react";

export function useDeliveryNoteForm(open, source, invoice, customer) {
  const defaultNotesText = `สินค้าทุกชิ้นตรวจสอบก่อนส่งเรียบร้อยแล้ว  
กรุณาตรวจสอบสินค้าทันทีเมื่อได้รับ หากพบปัญหาโปรดแจ้งภายใน 7 วันนับจากวันรับสินค้า  
ไม่รับคืนหรือเปลี่ยนสินค้าหลังจาก 7 วัน หรือกรณีสินค้ามีการใช้งาน / ซัก / ดัดแปลงแล้ว  
กรุณาซักด้วยมือและหลีกเลี่ยงการใช้สารฟอกขาว เพื่อยืดอายุการใช้งานของสินค้า`;

  const [customerDataSource, setCustomerDataSource] = useState("master");
  const [formState, setFormState] = useState({
    company_id: "",
    customer_id: "",
    customer_company: "",
    customer_address: "",
    customer_tel_1: "",
    customer_tax_id: "",
    customer_firstname: "",
    customer_lastname: "",
    work_name: "",
    quantity: "1",
    notes: defaultNotesText,
    notesSource: "default",
    sender_company_id: "",
  });

  // hydrate initial data
  useEffect(() => {
    if (!open) return;
    const hydrated = {
      company_id: source?.company_id || invoice?.company_id || "",
      customer_id: source?.customer_id || invoice?.customer_id || "",
      customer_company: source?.customer_company || invoice?.customer_company || "",
      customer_address:
        source?.delivery_address || source?.customer_address || invoice?.customer_address || "",
      customer_tel_1: source?.customer_phone || invoice?.customer_tel_1 || "",
      customer_tax_id: source?.customer_tax_id || invoice?.customer_tax_id || "",
      customer_firstname: source?.customer_firstname || invoice?.customer_firstname || "",
      customer_lastname: source?.customer_lastname || invoice?.customer_lastname || "",
      work_name: source?.work_name || source?.item_name || invoice?.work_name || "",
      quantity: String(source?.quantity || invoice?.quantity || "1"),
      notes: defaultNotesText,
      notesSource: "default",
      sender_company_id: source?.company_id || invoice?.company_id || "",
    };
    setFormState((prev) => ({ ...prev, ...hydrated }));
    setCustomerDataSource("master");
  }, [open, source, invoice, defaultNotesText]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCustomerDataSourceChange = (event, value) => {
    const newSource = value;
    // New rule: do NOT prefill from master when switching to delivery; keep current inputs
    setCustomerDataSource(newSource);
  };

  return {
    formState,
    setFormState,
    customerDataSource,
    setCustomerDataSource,
    handleChange,
    handleCustomerDataSourceChange,
  };
}
