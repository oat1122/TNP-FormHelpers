// Helper to transform editable grouped items from InvoiceItemsTable to API payload items
// groups: [{ name, description, pattern, fabric, color, rows:[{size, quantity, unit, originalItem}] }]
export function buildDeliveryNoteItemsFromGroups(groups, invoice) {
  if (!Array.isArray(groups) || groups.length === 0) return [];
  const items = [];
  let seq = 1;
  groups.forEach((g) => {
    (g.rows || []).forEach((r) => {
      const base = r.originalItem || {};
      items.push({
        sequence_order: seq++,
        item_name: g.name || base.item_name || base.name || invoice?.work_name || "งาน",
        item_description: g.description || base.item_description || undefined,
        pattern: g.pattern || base.pattern || undefined,
        fabric_type: g.fabric || base.fabric_type || base.material || undefined,
        color: g.color || base.color || undefined,
        size: r.size || base.size || undefined,
        delivered_quantity: Number(r.quantity) || 0,
        unit: r.unit || base.unit || "ชิ้น",
        invoice_id: invoice?.id,
        invoice_item_id: base.id,
        item_snapshot: base ? { ...base } : undefined,
      });
    });
  });
  return items;
}

export function buildCustomerSnapshot(customer) {
  if (!customer) return undefined;
  const snapshot = {
    cus_company: customer.cus_company,
    cus_address: customer.cus_address,
    cus_zip_code: customer.cus_zip_code,
    cus_tel_1: customer.cus_tel_1,
    cus_firstname: customer.cus_firstname,
    cus_lastname: customer.cus_lastname,
    cus_tax_id: customer.cus_tax_id,
  };
  return snapshot;
}

// Fallback: build items directly from invoice.items when groups are not available
export function buildDeliveryNoteItemsFromInvoice(invoice) {
  const items = [];
  if (!invoice?.items?.length) return items;
  let seq = 1;
  for (const base of invoice.items) {
    items.push({
      sequence_order: seq++,
      item_name: base.item_name || base.work_name || invoice?.work_name || "งาน",
      item_description: base.item_description || undefined,
      pattern: base.pattern || undefined,
      fabric_type: base.fabric_type || base.material || undefined,
      color: base.color || undefined,
      size: base.size || undefined,
      delivered_quantity: Number(base.quantity) || 0,
      unit: base.unit || "ชิ้น",
      invoice_id: invoice?.id,
      invoice_item_id: base.id,
      item_snapshot: { ...base },
    });
  }
  return items;
}
