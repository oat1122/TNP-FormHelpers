/**
 * Pure helpers ที่ใช้สำหรับ normalize ชื่อ/ค่าจาก master_customers relation.
 * Extracted from DeliveryNoteEditDialog.jsx — เดิม inline ใน useMemo.
 */

/**
 * Trim + treat dash-only strings (เช่น "-", "--", "–") เป็นค่าว่าง
 * เพื่อกัน case เก่าที่ข้อมูล legacy บันทึก "-" แทน null.
 */
export const cleanContactValue = (value) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/[—–]/g, "-");
  if (/^-+$/.test(normalized)) return "";
  return normalized;
};

/**
 * Build ชื่อผู้ติดต่อจาก master customer record:
 *  1) ใช้ firstname + lastname เมื่อมีอย่างน้อยตัวใดตัวหนึ่ง
 *  2) fallback ไป cus_name (ชื่อเล่น)
 *  3) return "" เมื่อทุกค่าว่าง
 */
export const buildMasterContactName = (customerRecord) => {
  const first = cleanContactValue(customerRecord?.cus_firstname);
  const last = cleanContactValue(customerRecord?.cus_lastname);
  const nick = cleanContactValue(customerRecord?.cus_name);
  const full = [first, last].filter(Boolean).join(" ");
  return full || nick || "";
};

/**
 * Build ชื่อผู้ดูแล (manager) สำหรับแสดงผล — fallback chain:
 *  firstname + lastname → username → "-"
 */
export const buildManagerDisplayName = (manager) => {
  if (!manager) return "-";
  const first = (manager.user_firstname || "").trim();
  const last = (manager.user_lastname || "").trim();
  const full = `${first} ${last}`.trim();
  return full || manager.username || "-";
};

/**
 * แปลง master_customers relation → flat object ที่ component อ่านง่าย.
 * Return null ถ้าไม่มี customer.
 */
export const normalizeMasterCustomer = (customerRecord) => {
  if (!customerRecord) return null;
  return {
    company: customerRecord.cus_company || "",
    taxId: customerRecord.cus_tax_id || "",
    firstName: customerRecord.cus_firstname || "",
    lastName: customerRecord.cus_lastname || "",
    phone: customerRecord.cus_tel_1 || "",
    address: customerRecord.cus_address || "",
    nickName: customerRecord.cus_name || "",
  };
};
