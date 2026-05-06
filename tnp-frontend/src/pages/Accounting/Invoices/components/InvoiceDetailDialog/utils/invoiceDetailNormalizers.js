/**
 * Pure helpers + lookup tables for InvoiceDetailDialog.
 *
 * Extracted from InvoiceDetailDialog.jsx during Phase 1a of redesign refactor
 * (invoice-detail-dialog-redesign plan). No behavior change — same logic, new home.
 */

export const typeLabels = {
  full_amount: "เต็มจำนวน",
  remaining: "ยอดคงเหลือ (หลังหักมัดจำ)",
  deposit: "มัดจำ",
  partial: "เรียกเก็บบางส่วน",
};

export const statusColors = {
  draft: "default",
  pending: "warning",
  pending_review: "warning",
  approved: "success",
  rejected: "error",
  sent: "info",
  partial_paid: "warning",
  fully_paid: "success",
  overdue: "error",
};

/**
 * Normalize customer data from master_customers relationship.
 * Returns {} if invoice or invoice.customer is missing.
 */
export const normalizeCustomer = (invoice) => {
  if (!invoice) return {};

  const customer = invoice.customer;
  if (!customer) return {};

  return {
    customer_type: customer.cus_company ? "company" : "individual",
    cus_name: customer.cus_name,
    cus_firstname: customer.cus_firstname,
    cus_lastname: customer.cus_lastname,
    cus_company: customer.cus_company,
    cus_tel_1: customer.cus_tel_1,
    cus_tel_2: customer.cus_tel_2,
    cus_email: customer.cus_email,
    cus_tax_id: customer.cus_tax_id,
    cus_address: customer.cus_address,
    cus_zip_code: customer.cus_zip_code,
    cus_depart: customer.cus_depart,
    contact_name:
      customer.cus_firstname && customer.cus_lastname
        ? `${customer.cus_firstname} ${customer.cus_lastname}`.trim()
        : customer.cus_name,
    contact_nickname: customer.cus_name,
  };
};

/**
 * Normalize invoice items into work groups (same shape used by Calculation section).
 * Groups by (item_name, pattern, fabric_type, color); accumulates quantity + total.
 */
export const normalizeItems = (invoice) => {
  if (!invoice?.items) return [];

  const groups = new Map();

  invoice.items.forEach((item, index) => {
    const groupKey = `${item.item_name}-${item.pattern}-${item.fabric_type}-${item.color}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: `group-${index}`,
        name: item.item_name,
        pattern: item.pattern,
        fabric_type: item.fabric_type,
        fabricType: item.fabric_type, // camelCase alias for FE consistency
        color: item.color,
        size: item.size,
        unit: item.unit || "ชิ้น",
        sizeRows: [],
        items: [],
      });
    }

    const group = groups.get(groupKey);

    group.items.push({
      ...item,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: (item.quantity || 0) * (item.unit_price || 0),
    });

    if (item.size && item.quantity > 0) {
      group.sizeRows.push({
        size: item.size,
        quantity: item.quantity || 0,
        unitPrice: item.unit_price || 0,
        notes: item.notes || "",
      });
    }
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    quantity: group.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    total: group.items.reduce((sum, item) => sum + (item.total || 0), 0),
    sizeRows: group.sizeRows.length > 0 ? group.sizeRows : [],
  }));
};
