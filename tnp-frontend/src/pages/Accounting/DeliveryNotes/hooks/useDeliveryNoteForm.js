import { useState, useEffect } from "react";

export function useDeliveryNoteForm(open, source, invoice, customer) {
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
    notes: "",
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
      notes: "",
      sender_company_id: source?.company_id || invoice?.company_id || "",
    };
    setFormState((prev) => ({ ...prev, ...hydrated }));
    setCustomerDataSource("master");
  }, [open, source, invoice]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCustomerDataSourceChange = (event, value) => {
    const newSource = value;
    // If switching to 'delivery', prefill editable fields from master customer
    if (newSource === "delivery" && customer) {
      setFormState((prev) => ({
        ...prev,
        customer_company: customer.cus_company || prev.customer_company || "",
        customer_address: customer.cus_address || prev.customer_address || "",
        customer_tel_1: customer.cus_tel_1 || prev.customer_tel_1 || "",
        customer_tax_id: customer.cus_tax_id || prev.customer_tax_id || "",
        customer_firstname: customer.cus_firstname || prev.customer_firstname || "",
        customer_lastname: customer.cus_lastname || prev.customer_lastname || "",
      }));
    }
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
