import { useMemo } from "react";

import { ADMIN_USER_ID, EDIT_DELIVERY_NOTE_ROLES } from "../utils/editDialogConstants";

/**
 * ตรวจสิทธิ์การแก้ไขใบส่งของจาก userData ใน localStorage.
 * คืน { canEdit, isAdmin, isAccount } — ใช้ disable input + ซ่อนปุ่มบันทึก.
 *
 * Memoize ผ่าน useMemo เพื่อกัน JSON.parse ทำใหม่ทุก render.
 */
export function useEditPermission() {
  return useMemo(() => {
    let userData = {};
    try {
      userData = JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      userData = {};
    }
    const isAdmin = userData.user_id === ADMIN_USER_ID;
    const isAccount = EDIT_DELIVERY_NOTE_ROLES.includes(userData.role);
    return { canEdit: isAdmin || isAccount, isAdmin, isAccount };
  }, []);
}
