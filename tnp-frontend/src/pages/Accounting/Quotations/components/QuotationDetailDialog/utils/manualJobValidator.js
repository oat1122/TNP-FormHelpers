// Pure validator for manual (custom) quotation jobs.
// Returns array of error messages — empty array means valid.
export function validateManualJob(group) {
  const errors = [];

  if (!group?.name || String(group.name).trim() === "") {
    errors.push("กรุณากรอกชื่องาน");
  }

  const hasValidRows = Array.isArray(group?.sizeRows) && group.sizeRows.length > 0;
  if (!hasValidRows) {
    errors.push("กรุณาเพิ่มอย่างน้อย 1 รายการขนาด");
    return errors;
  }

  const allRowsEmpty = group.sizeRows.every(
    (row) =>
      (!row.quantity || row.quantity === "" || row.quantity === 0) &&
      (!row.unitPrice || row.unitPrice === "" || row.unitPrice === 0)
  );
  if (allRowsEmpty) {
    errors.push("กรุณากรอกจำนวนและราคาอย่างน้อย 1 รายการ");
  }

  return errors;
}

// Aggregate validation across all groups. Returns
//   { hasErrors: boolean, message: string | null }
// where `message` is a multi-line string suitable for showError().
export function collectManualJobErrors(groups = []) {
  const perGroup = {};
  let hasErrors = false;

  groups.forEach((group) => {
    if (!group?.isManual) return;
    const errors = validateManualJob(group);
    if (errors.length > 0) {
      perGroup[group.id] = errors;
      hasErrors = true;
    }
  });

  if (!hasErrors) return { hasErrors: false, message: null };

  const message = Object.entries(perGroup)
    .map(([groupId, errors]) => {
      const groupIndex = groups.findIndex((g) => g.id === groupId);
      const groupName = groups[groupIndex]?.name || `งานที่ ${groupIndex + 1}`;
      return `${groupName}: ${errors.join(", ")}`;
    })
    .join("\n");

  return { hasErrors: true, message };
}
