// Adapter to normalize various quotation payloads into a preview-friendly shape
// Inputs: { formData, record, quotationNumber }
// Output shape:
// {
//   company: { name, address, phone, taxId },
//   customer: { cus_company, cus_name, cus_address, cus_phone },
//   items: [{ name, pattern, fabricType, color, unit, quantity, unit_price, sizeRows: [{ size, quantity, unit_price }] }],
//   notes, date, subtotal, vat, total, depositAmount, remainingAmount, terms, quotationNumber
// }

export function adaptQuotationPayloadToPreview({
  formData = {},
  record = null,
  quotationNumber = "",
} = {}) {
  const src = record || formData || {};

  const company = {
    name: src.company?.name || src.company_name || "บริษัทของคุณ",
    address: src.company?.address || src.company_address || "",
    phone: src.company?.phone || src.company_phone || "",
    taxId: src.company?.taxId || src.company_tax_id || src.tax_id || "",
  };

  const customer = {
    cus_company:
      src.customer?.cus_company || src.customer?.company || src.cus_company || src.company || "",
    cus_name: src.customer?.cus_name || src.customer?.name || src.cus_name || src.name || "",
    cus_address:
      src.customer?.cus_address || src.customer?.address || src.cus_address || src.address || "",
    cus_phone: src.customer?.cus_phone || src.customer?.phone || src.cus_phone || src.phone || "",
  };

  const normalizeItem = (it) => {
    const rows = Array.isArray(it.sizeRows) ? it.sizeRows : Array.isArray(it.sizes) ? it.sizes : [];
    return {
      id: it.id,
      name: it.name || it.product_name || it.item_name || "",
      pattern: it.pattern || it.product_pattern || "",
      fabricType: it.fabricType || it.fabric_type || "",
      color: it.color || it.fabric_color || "",
      unit: it.unit || it.uom || "ชิ้น",
      quantity: Number(it.quantity || 0),
      unit_price: Number(it.unit_price ?? it.unitPrice ?? it.price ?? 0),
      subtotal: Number(it.subtotal ?? it.total ?? 0),
      notes: it.notes || "",
      sizeRows: rows.map((r) => ({
        size: r.size || r.label || "",
        quantity: Number(r.quantity || r.qty || 0),
        unit_price: Number(r.unit_price ?? r.unitPrice ?? r.price ?? 0),
      })),
    };
  };

  const items = (Array.isArray(src.items) ? src.items : []).map(normalizeItem);

  const subtotal = n(src.subtotal) ?? sumItems(items);
  const vat = n(src.vat) ?? Math.round(subtotal * 0.07 * 100) / 100;
  const total = n(src.total) ?? subtotal + vat;
  const depositAmount = n(src.depositAmount) ?? 0;
  const remainingAmount = n(src.remainingAmount) ?? Math.max(total - depositAmount, 0);

  return {
    company,
    customer,
    items,
    date: src.date || src.created_at || new Date().toISOString(),
    notes: src.notes || "",
    subtotal,
    vat,
    total,
    depositAmount,
    remainingAmount,
    terms: src.terms || src.term_text || "",
    quotationNumber: quotationNumber || src.quotationNumber || src.quotation_no || "",
  };
}

function n(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : undefined;
}

function sumItems(items) {
  return items.reduce((sum, it) => {
    if (Number.isFinite(it.subtotal) && it.subtotal > 0) return sum + it.subtotal;
    const rows = Array.isArray(it.sizeRows) ? it.sizeRows : [];
    const qty =
      rows.reduce((s, r) => s + Number(r.quantity || 0), 0) || Number(it.quantity || 0) || 0;
    const unit = Number(it.unit_price || 0);
    if (rows.length > 0) {
      return (
        sum + rows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unit_price || 0), 0)
      );
    }
    return sum + unit * qty;
  }, 0);
}
