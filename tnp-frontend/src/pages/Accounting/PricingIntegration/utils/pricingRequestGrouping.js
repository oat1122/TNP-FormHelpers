export const groupPricingRequestsByCustomer = (requests, customerOverrides = {}) => {
  if (!requests) return [];
  const map = new Map();

  requests.forEach((req) => {
    const customerData = req.pricing_customer || req.customer;
    const customerId =
      req._customerId ||
      (customerData?.cus_id || req.pr_cus_id || req.customer_id || req.cus_id || "").toString();

    if (!customerId) return;

    if (!map.has(customerId)) {
      map.set(customerId, {
        _customerId: customerId,
        customer: {
          ...customerData,
          ...(customerOverrides[customerId] || {}),
        },
        requests: [req],
        is_quoted: !!req.is_quoted,
        has_quotation: !!req.is_quoted,
        quoted_count: req.is_quoted ? 1 : 0,
        status_counts: req.pr_status ? { [req.pr_status]: 1 } : {},
      });
      return;
    }

    const existing = map.get(customerId);
    existing.requests.push(req);

    if (req.is_quoted) {
      existing.has_quotation = true;
      existing.quoted_count += 1;
    } else {
      existing.is_quoted = false;
    }

    if (req.pr_status) {
      existing.status_counts[req.pr_status] = (existing.status_counts[req.pr_status] || 0) + 1;
    }
  });

  map.forEach((val) => {
    val.total_count = val.requests.length;
  });

  return Array.from(map.values());
};
