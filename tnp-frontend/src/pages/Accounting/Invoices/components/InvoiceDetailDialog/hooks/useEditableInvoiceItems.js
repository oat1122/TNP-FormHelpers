import { useEffect, useState } from "react";

import { normalizeItems } from "../utils/invoiceDetailNormalizers";

/**
 * จัดการ state ของ editable items + handlers สำหรับ size row CRUD.
 * Extracted from InvoiceDetailDialog.jsx — เดิม inline ~80 บรรทัด.
 *
 * Hook นี้ไม่รู้เรื่อง save/persist — ส่งกลับ items ให้ shell ใช้กับ
 * payload builder / calculation hook.
 */
export function useEditableInvoiceItems(invoice) {
  const [editableItems, setEditableItems] = useState([]);

  // Initialize เมื่อ invoice เปลี่ยนหรือ items มา
  useEffect(() => {
    if (invoice?.items && invoice.items.length > 0) {
      const processedItems = normalizeItems(invoice).map((item) => ({
        ...item,
        // Preserve Backend fields เพื่อ update
        quotation_item_id: item.items?.[0]?.quotation_item_id || null,
        pricing_request_id: item.items?.[0]?.pricing_request_id || null,
        item_description: item.items?.[0]?.item_description || null,
        discount_percentage: item.items?.[0]?.discount_percentage || 0,
        discount_amount: item.items?.[0]?.discount_amount || 0,
        status: item.items?.[0]?.status || "draft",
        originalQuantity: item.quantity,
      }));
      setEditableItems(processedItems);
    }
  }, [invoice]);

  const handleAddSizeRow = (itemIndex, newRow = { size: "", quantity: 0, unitPrice: 0 }) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIndex) return item;
        const sizeRows = Array.isArray(item.sizeRows) ? [...item.sizeRows] : [];
        sizeRows.push(newRow);
        return { ...item, sizeRows };
      })
    );
  };

  const handleChangeSizeRow = (itemIndex, rowIndex, field, value) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIndex || !Array.isArray(item.sizeRows)) return item;
        const sizeRows = [...item.sizeRows];
        if (sizeRows[rowIndex]) {
          sizeRows[rowIndex] = { ...sizeRows[rowIndex], [field]: value };
        }
        return { ...item, sizeRows };
      })
    );
  };

  const handleRemoveSizeRow = (itemIndex, rowIndex) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== itemIndex || !Array.isArray(item.sizeRows)) return item;
        const sizeRows = [...item.sizeRows];
        sizeRows.splice(rowIndex, 1);
        return { ...item, sizeRows };
      })
    );
  };

  const handleDeleteItem = (itemIndex) => {
    setEditableItems((prev) => prev.filter((_, idx) => idx !== itemIndex));
  };

  const handleChangeItem = (itemIndex, field, value) => {
    setEditableItems((prev) =>
      prev.map((item, idx) => (idx === itemIndex ? { ...item, [field]: value } : item))
    );
  };

  /**
   * Reset เป็นข้อมูล original จาก invoice (ใช้กับปุ่มรีเซ็ต)
   */
  const resetItems = () => {
    if (!invoice?.items) return;
    const processedItems = invoice.items.map((item) => ({
      ...item,
      sizeRows: item.size_details || [],
      originalQuantity: item.quantity,
    }));
    setEditableItems(processedItems);
  };

  return {
    editableItems,
    setEditableItems,
    handleAddSizeRow,
    handleChangeSizeRow,
    handleRemoveSizeRow,
    handleDeleteItem,
    handleChangeItem,
    resetItems,
  };
}
