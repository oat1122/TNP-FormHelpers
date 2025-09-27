// Utility functions for Quotation detail handling

// Normalize API response
export const pickQuotation = (resp) => (resp && resp.data) || resp || {};

// Normalize customer object for editor compatibility
export const normalizeCustomer = (q) => {
  const c = q?.customer || {};
  const cus_id = c.cus_id || c.id || q?.customer_id || null;
  const cus_company = c.cus_company || q?.customer_name || "";
  const cus_tax_id = c.cus_tax_id || q?.customer_tax_id || "";
  const cus_email = c.cus_email || q?.customer_email || "";
  const cus_tel_1 = c.cus_tel_1 || c.cus_phone || q?.customer_phone || "";
  const cus_tel_2 = c.cus_tel_2 || "";
  const cus_firstname = c.cus_firstname || c.contact_firstname || q?.contact_firstname || "";
  const cus_lastname = c.cus_lastname || c.contact_lastname || q?.contact_lastname || "";
  const cus_name = c.cus_name || c.contact_nickname || q?.contact_nickname || "";
  const cus_depart = c.cus_depart || c.contact_position || q?.contact_position || "";
  const cus_address = c.cus_address || q?.customer_address || "";
  const cus_zip_code = c.cus_zip_code || "";
  const cus_channel = c.cus_channel ?? c.channel ?? "";
  const cus_bt_id = c.cus_bt_id ?? c.bt_id ?? c.business_type_id ?? c.business_type?.bt_id ?? "";
  const cus_pro_id = c.cus_pro_id || "";
  const cus_dis_id = c.cus_dis_id || "";
  const cus_sub_id = c.cus_sub_id || "";
  const customer_type = c.customer_type || c.cus_type || (cus_company ? "company" : "individual");

  return {
    ...c,
    cus_id,
    cus_company,
    cus_tax_id,
    cus_email,
    cus_tel_1,
    cus_tel_2,
    cus_firstname,
    cus_lastname,
    cus_name,
    cus_depart,
    cus_address,
    cus_zip_code,
    cus_channel,
    cus_bt_id: cus_bt_id === "" ? "" : String(cus_bt_id),
    cus_pro_id,
    cus_dis_id,
    cus_sub_id,
    customer_type,
    contact_name: c.contact_name || q?.contact_name || c.cus_contact_name || "",
    contact_nickname: c.contact_nickname || q?.contact_nickname || "",
    contact_position: c.contact_position || q?.contact_position || "",
    contact_phone_alt: c.contact_phone_alt || q?.contact_phone_alt || "",
  };
};

// Collect all PR ids referenced by a quotation (primary + array + from items)
export const getAllPrIdsFromQuotation = (q = {}) => {
  const set = new Set();
  const primary = q.primary_pricing_request_id || q.primary_pricing_request || null;
  if (primary) set.add(primary);
  let arr = [];
  if (Array.isArray(q.primary_pricing_request_ids)) arr = q.primary_pricing_request_ids;
  else if (
    typeof q.primary_pricing_request_ids === "string" &&
    q.primary_pricing_request_ids.trim()
  ) {
    try {
      arr = JSON.parse(q.primary_pricing_request_ids);
    } catch (e) {
      // ignore
    }
  }
  arr.forEach((id) => id && set.add(id));
  const items = Array.isArray(q.items) ? q.items : [];
  items.forEach((it) => {
    if (it?.pricing_request_id) set.add(it.pricing_request_id);
  });
  return Array.from(set);
};

// Build normalized quotation_items then group them by pricing_request_id
export const normalizeAndGroupItems = (q = {}, prIdsAll = []) => {
  const items = Array.isArray(q.items) ? q.items : [];
  const sorted = [...items].sort(
    (a, b) => Number(a?.sequence_order ?? 0) - Number(b?.sequence_order ?? 0)
  );

  const normalized = sorted.map((it, idx) => {
    const nameRaw =
      it.item_name || it.work_name || it.name || it.item_description || it.description || "";
    const name = nameRaw || "-";
    const unit = it.unit || it.unit_name || "ชิ้น";
    const unitPrice = Number(it.unit_price || 0);
    const baseRow = {
      uuid: `${it.id || idx}-row-1`,
      size: it.size || "",
      quantity: Number(it.quantity || 0),
      unitPrice,
      notes: it.notes || "",
    };
    const sizeRows =
      Array.isArray(it.size_rows) && it.size_rows.length
        ? it.size_rows.map((r, rIdx) => ({
            uuid: r.uuid || `${it.id || idx}-row-${rIdx + 1}`,
            size: r.size || "",
            quantity: Number(r.quantity || 0),
            unitPrice: Number(r.unit_price || unitPrice || 0),
            notes: r.notes || "",
          }))
        : [baseRow];
    return {
      id: it.id || `qitem_${idx}`,
      prId: it.pricing_request_id || null,
      name,
      pattern: it.pattern || "",
      fabricType: it.fabric_type || it.material || "",
      color: it.color || "",
      size: it.size || "",
      unit,
      unitPrice,
      sizeRows,
      sequence: Number(it?.sequence_order ?? idx + 1),
    };
  });

  const groupMap = new Map();
  for (const it of normalized) {
    const key = it.prId || `misc-${it.sequence}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        id: key,
        prId: it.prId || null,
        nameCandidates: [],
        patterns: new Set(),
        fabrics: new Set(),
        colors: new Set(),
        sizes: new Set(),
        unitCandidates: new Set(),
        sizeRows: [],
        sequenceMin: it.sequence,
      });
    }
    const g = groupMap.get(key);
    g.sequenceMin = Math.min(g.sequenceMin, it.sequence);
    const baseName = (it.name || "").split(" - ")[0] || it.name;
    if (baseName) g.nameCandidates.push(baseName);
    if (it.pattern) g.patterns.add(it.pattern);
    if (it.fabricType) g.fabrics.add(it.fabricType);
    if (it.color) g.colors.add(it.color);
    if (it.size) g.sizes.add(it.size);
    if (it.unit) g.unitCandidates.add(it.unit);
    if (Array.isArray(it.sizeRows)) g.sizeRows.push(...it.sizeRows);
  }

  for (let i = 0; i < prIdsAll.length; i++) {
    const pid = prIdsAll[i];
    if (!groupMap.has(pid)) {
      groupMap.set(pid, {
        id: pid,
        prId: pid,
        nameCandidates: [],
        patterns: new Set(),
        fabrics: new Set(),
        colors: new Set(),
        sizes: new Set(),
        unitCandidates: new Set(["ชิ้น"]),
        sizeRows: [],
        sequenceMin: Number.MAX_SAFE_INTEGER - (prIdsAll.length - i),
      });
    }
  }

  const groups = Array.from(groupMap.values())
    .sort((a, b) => a.sequenceMin - b.sequenceMin)
    .map((g, idx) => {
      const name = g.nameCandidates.find(Boolean) || "-";
      const unit = g.unitCandidates.size === 1 ? Array.from(g.unitCandidates)[0] : "ชิ้น";
      const sizeSummarySet = new Set([
        ...Array.from(g.sizes),
        ...g.sizeRows.map((r) => r.size).filter(Boolean),
      ]);
      const sizeSummary = Array.from(sizeSummarySet).join(", ");
      return {
        id: g.id || `group_${idx}`,
        prId: g.prId,
        name,
        pattern: Array.from(g.patterns).join(", "),
        fabricType: Array.from(g.fabrics).join(", "),
        color: Array.from(g.colors).join(", "),
        size: sizeSummary,
        unit,
        sizeRows: g.sizeRows,
      };
    });

  return groups;
};

export const computeTotals = (items = [], depositPercentage) => {
  const subtotal = items.reduce((s, it) => {
    const itemTotal = (it.sizeRows || []).reduce((ss, r) => {
      const q =
        typeof r.quantity === "string" ? parseFloat(r.quantity || "0") : Number(r.quantity || 0);
      const p =
        typeof r.unitPrice === "string" ? parseFloat(r.unitPrice || "0") : Number(r.unitPrice || 0);
      return ss + (isNaN(q) || isNaN(p) ? 0 : q * p);
    }, 0);
    return s + itemTotal;
  }, 0);
  const vat = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);
  const depPct = Math.max(0, Math.min(100, Number(depositPercentage || 0)));
  const depositAmount = +(total * (depPct / 100)).toFixed(2);
  const remainingAmount = +(total - depositAmount).toFixed(2);
  return { subtotal, vat, total, depositAmount, remainingAmount };
};

export const toISODate = (d) => {
  if (!d) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
