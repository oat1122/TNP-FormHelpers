import { useEffect, useState } from "react";

import { groupDeliveryNoteItemsByProduct } from "../../../utils/deliveryNoteGrouping";

/**
 * จัดกลุ่ม items ของ delivery note (รองรับทั้ง `items` และ
 * `delivery_note_items`) สำหรับใช้ใน editable table.
 * Extracted from DeliveryNoteEditDialog.jsx.
 */
export function useGroupedNoteItems(note) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const items = Array.isArray(note?.items)
      ? note.items
      : Array.isArray(note?.delivery_note_items)
        ? note.delivery_note_items
        : [];
    setGroups(groupDeliveryNoteItemsByProduct(items));
  }, [note?.items, note?.delivery_note_items]);

  return { groups, setGroups };
}
