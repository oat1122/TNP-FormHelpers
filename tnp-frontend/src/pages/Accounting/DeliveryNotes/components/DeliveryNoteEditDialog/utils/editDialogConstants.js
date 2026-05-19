/**
 * Constants used across DeliveryNoteEditDialog subtree.
 * Extracted from DeliveryNoteEditDialog.jsx during refactor 2026-05-19.
 */

// Default warranty/care text shown on every delivery note unless user overrides
export const DEFAULT_DELIVERY_NOTES_TEXT = `สินค้าเสียหายตำหนิสามารถเคลมเปลี่ยนสินค้าใหม่ภายใน 7 วัน
(โดยสินค้าชิ้นนั้นจะต้องยังไม่ถูกผ่านการใช้งาน หรือการซัก)`;

// Roles that may edit a delivery note in addition to user_id===1 (admin)
export const ADMIN_USER_ID = 1;
export const EDIT_DELIVERY_NOTE_ROLES = ["account"];

// Status under which editing is permitted
export const EDITABLE_STATUS = "preparing";

// Default unit applied to a brand-new item row
export const DEFAULT_ITEM_UNIT = "ชิ้น";
