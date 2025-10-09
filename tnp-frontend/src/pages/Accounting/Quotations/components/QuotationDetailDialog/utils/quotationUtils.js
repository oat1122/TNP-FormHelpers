// 📁utils/quotationUtils.js

// Pick quotation data from response
export function pickQuotation(data) {
  return data?.data || data || {};
}

// Normalize customer data
export function normalizeCustomer(q) {
  return q?.customer || {
    customer_name: q?.customer_name || "",
    customer_type: q?.customer_type || "individual",
    cus_firstname: q?.cus_firstname || "",
    cus_lastname: q?.cus_lastname || "",
    cus_name: q?.cus_name || "",
    cus_company: q?.cus_company || "",
    cus_tel_1: q?.cus_tel_1 || "",
    cus_email: q?.cus_email || "",
    cus_tax_id: q?.cus_tax_id || "",
    cus_address: q?.cus_address || "",
    contact_name: q?.contact_name || "",
    contact_nickname: q?.contact_nickname || "",
  };
}

// Calculate totals from groups
export function computeTotals(groups = [], depositPercentage = 0) {
  const subtotal = groups.reduce((total, group) => {
    const groupTotal = (group.sizeRows || []).reduce((sum, row) => {
      const qty = Number(row.quantity || 0);
      const price = Number(row.unitPrice || 0);
      return sum + (qty * price);
    }, 0);
    return total + groupTotal;
  }, 0);

  const vat = subtotal * 0.07;
  const total = subtotal + vat;
  const deposit = total * (Number(depositPercentage || 0) / 100);
  
  return { subtotal, vat, total, deposit };
}

// Convert date to ISO format
export function toISODate(date) {
  if (!date) return null;
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
}

// Get all PR IDs from quotation
export function getAllPrIdsFromQuotation(quotation) {
  if (!quotation?.items) return [];
  return [...new Set(quotation.items.map(item => item.pricing_request_id).filter(Boolean))];
}

// Normalize and group items
export function normalizeAndGroupItems(quotation, prIds = []) {
  const items = quotation?.items || [];
  
  // Group items by pricing_request_id and item_name
  const grouped = items.reduce((acc, item) => {
    const key = `${item.pricing_request_id || 'no-pr'}_${item.item_name || 'no-name'}`;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        prId: item.pricing_request_id,
        name: item.item_name,
        pattern: item.pattern,
        fabricType: item.fabric_type,
        color: item.color,
        size: item.size,
        unit: item.unit || "ชิ้น",
        sizeRows: []
      };
    }
    
    acc[key].sizeRows.push({
      uuid: `${key}_${acc[key].sizeRows.length}`,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      notes: item.notes
    });
    
    return acc;
  }, {});
  
  return Object.values(grouped);
}