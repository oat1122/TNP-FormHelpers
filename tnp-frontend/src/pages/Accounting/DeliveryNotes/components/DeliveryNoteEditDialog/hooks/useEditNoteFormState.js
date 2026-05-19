import { useEffect, useMemo, useState } from "react";

import { DEFAULT_DELIVERY_NOTES_TEXT } from "../utils/editDialogConstants";

const INITIAL_FORM_STATE = {
  customer_company: "",
  customer_tax_id: "",
  customer_firstname: "",
  customer_lastname: "",
  customer_tel_1: "",
  customer_address: "",
  work_name: "",
  quantity: "",
  notes: "",
  sender_company_id: "",
};

/**
 * จัดการ form state ของ DeliveryNoteEditDialog —
 *  - hydrate ค่าจาก note เมื่อโหลดสำเร็จ
 *  - radio "customerDataSource" (master | delivery)
 *  - radio "notesSource" (default | custom) + sync default text
 *
 * Extracted from DeliveryNoteEditDialog.jsx (~80 บรรทัด state + effect + handlers).
 */
export function useEditNoteFormState(note) {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [customerDataSource, setCustomerDataSource] = useState("delivery");
  const [notesSource, setNotesSource] = useState("default");

  // hydrate เมื่อ note พร้อม
  useEffect(() => {
    if (!note) return;
    const hasCustomNotes = note.notes && note.notes !== DEFAULT_DELIVERY_NOTES_TEXT;
    setFormState({
      customer_company: note.customer_company || "",
      customer_tax_id: note.customer_tax_id || "",
      customer_firstname: note.customer_firstname || "",
      customer_lastname: note.customer_lastname || "",
      customer_tel_1: note.customer_tel_1 || "",
      customer_address: note.customer_address || "",
      work_name: note.work_name || "",
      quantity: note.quantity || "",
      notes: note.notes || DEFAULT_DELIVERY_NOTES_TEXT,
      sender_company_id: note.sender_company_id || "",
    });
    setCustomerDataSource(note.customer_data_source || "delivery");
    setNotesSource(hasCustomNotes ? "custom" : "default");
  }, [note]);

  // field change generator
  const handleFieldChange = useMemo(
    () => (field) => (event) => setFormState((prev) => ({ ...prev, [field]: event.target.value })),
    []
  );

  const handleCustomerDataSourceChange = (event) => {
    setCustomerDataSource(event.target.value);
  };

  const handleNotesSourceChange = (event) => {
    const next = event.target.value;
    setNotesSource(next);
    if (next === "default") {
      setFormState((prev) => ({ ...prev, notes: DEFAULT_DELIVERY_NOTES_TEXT }));
    }
  };

  return {
    formState,
    customerDataSource,
    notesSource,
    handleFieldChange,
    handleCustomerDataSourceChange,
    handleNotesSourceChange,
  };
}
