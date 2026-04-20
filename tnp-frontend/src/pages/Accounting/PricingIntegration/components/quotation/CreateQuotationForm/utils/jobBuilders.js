export const createEmptySizeRow = (uuid) => ({
  uuid,
  size: "",
  quantity: "",
  unitPrice: "",
  notes: "",
});

export const createManualJob = () => {
  const stamp = Date.now();
  return {
    id: `manual_${stamp}`,
    isFromPR: false,
    isManual: true,
    name: "",
    pattern: "",
    fabricType: "",
    color: "",
    size: "",
    unit: "ชิ้น",
    quantity: 0,
    unitPrice: 0,
    notes: "",
    sizeRows: [createEmptySizeRow(`manual_${stamp}_row_1`)],
  };
};

export const createItemFromPR = (pr, idx) => {
  const baseId = pr.pr_id || pr.id || `temp_${idx}`;
  return {
    id: baseId,
    pricingRequestId: pr.pr_id,
    isFromPR: true,
    name: pr.pr_work_name || pr.work_name || "ไม่ระบุชื่องาน",
    pattern: pr.pr_pattern || pr.pattern || "",
    fabricType: pr.pr_fabric_type || pr.fabric_type || pr.material || "",
    color: pr.pr_color || pr.color || "",
    size: pr.pr_sizes || pr.sizes || pr.size || "",
    unit: "ชิ้น",
    quantity: parseInt(pr.pr_quantity || pr.quantity || 1, 10),
    unitPrice: pr.pr_unit_price ? Number(pr.pr_unit_price) : 0,
    notes: pr.pr_notes || pr.notes || "",
    originalData: pr,
    sizeRows: [
      {
        uuid: `${baseId}-size-1`,
        size: pr.pr_sizes || "S-XL",
        quantity: parseInt(pr.pr_quantity || 1, 10),
        unitPrice: pr.pr_unit_price ? Number(pr.pr_unit_price) : 0,
        notes: "",
      },
    ],
  };
};

export const createAppendSizeRow = (itemId, existingRowsLength, initialUnitPrice) => ({
  uuid: `${itemId}-size-${(existingRowsLength || 0) + 1}`,
  size: "",
  quantity: "",
  unitPrice: String(initialUnitPrice || ""),
  notes: "",
});
