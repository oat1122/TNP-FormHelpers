// 📁utils/deliveryNoteGrouping.js
// Shared grouping logic for invoice items and delivery note items

/**
 * Group raw invoice items (from invoice.items) by product key.
 * Used when building a DeliveryNote from an Invoice.
 */
export function groupInvoiceItemsByProduct(items = []) {
  const map = new Map();
  items.forEach((it, idx) => {
    const name = it.item_name || it.name || "-";
    const pattern = it.pattern || "";
    const fabric = it.fabric_type || it.material || "";
    const color = it.color || "";
    const workName = it.work_name || "-";
    const key = [name, pattern, fabric, color, workName].join("||");

    if (!map.has(key)) {
      map.set(key, {
        key,
        name,
        pattern,
        fabric,
        color,
        workName,
        description: it.item_description || "-",
        rows: [],
      });
    }

    const q =
      typeof it.quantity === "string" ? parseFloat(it.quantity || "0") : Number(it.quantity || 0);

    map.get(key).rows.push({
      id: it.id || `${idx}`,
      sequence_order: it.sequence_order || idx + 1,
      size: it.size || "",
      quantity: isNaN(q) ? 0 : q,
      unit: it.unit || "ชิ้น",
      originalItem: it,
    });
  });

  return Array.from(map.values()).map((g) => ({
    ...g,
    totalQty: g.rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
  }));
}

/**
 * Group delivery note items (from note.items / note.delivery_note_items) by product key.
 * Used in DeliveryNoteCard and DeliveryNoteEditDialog.
 */
export function groupDeliveryNoteItemsByProduct(items = []) {
  const map = new Map();
  items.forEach((it, idx) => {
    const name = it.item_name || "-";
    const pattern = it.pattern || "";
    const fabric = it.fabric_type || "";
    const color = it.color || "";
    const workName = name;
    const key = [name, pattern, fabric, color, workName].join("||");

    if (!map.has(key)) {
      map.set(key, {
        key,
        name,
        pattern,
        fabric,
        color,
        workName,
        description: it.item_description || "-",
        rows: [],
      });
    }

    const qty =
      Number(
        typeof it.delivered_quantity === "string"
          ? parseFloat(it.delivered_quantity || "0")
          : it.delivered_quantity || 0
      ) || 0;

    let snap = {};
    try {
      snap =
        typeof it.item_snapshot === "string"
          ? JSON.parse(it.item_snapshot)
          : it.item_snapshot || {};
    } catch {
      snap = {};
    }
    const unitPrice =
      Number(snap?.unit_price ?? snap?.price_per_unit ?? snap?.price_unit ?? snap?.price ?? 0) || 0;

    map.get(key).rows.push({
      id: it.id || `${idx}`,
      size: it.size || "",
      quantity: qty,
      unitPrice,
      unit: it.unit || "ชิ้น",
      total: unitPrice * qty,
    });
  });

  return Array.from(map.values()).map((g) => ({
    ...g,
    totalQty: g.rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0),
    totalAmount: g.rows.reduce((s, r) => s + (Number(r.total) || 0), 0),
  }));
}
