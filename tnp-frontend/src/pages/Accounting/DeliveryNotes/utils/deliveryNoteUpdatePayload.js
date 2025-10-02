// Transform grouped rows back to delivery_note_items payload for update
// groups: [{ name, description, pattern, fabric, color, rows:[{size, quantity, unit}] }]
export function buildUpdateItemsFromGroups(groups, note) {
  if (!Array.isArray(groups) || groups.length === 0) return [];
  const items = [];
  let seq = 1;
  groups.forEach((g) => {
    (g.rows || []).forEach((r) => {
      items.push({
        sequence_order: seq++,
        item_name: g.name || note?.work_name || "งาน",
        item_description: g.description || undefined,
        pattern: g.pattern || undefined,
        fabric_type: g.fabric || undefined,
        color: g.color || undefined,
        size: r.size || undefined,
        delivered_quantity: Number(r.quantity) || 0,
        unit: r.unit || "ชิ้น",
        invoice_id: note?.invoice_id,
        // Not sending invoice_item_id on update because grouping may differ; keep minimal fields
      });
    });
  });
  return items;
}
