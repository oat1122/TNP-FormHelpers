import { useEffect } from "react";

/**
 * Auto-sync ยอด `paid_amount_before` / `paid_amount_after` ของ side-edit
 * จาก live calculation (depositAmount + finalTotalAmount) — เคารพการแก้
 * manual ผ่าน hook (sideEdit.syncDerivedAmounts).
 *
 * แยกออกจาก shell เพื่อรวม useEffect ที่ depend สอง field ของ calculation ไว้ที่เดียว.
 */
export function useSyncSideAmounts(calculation, syncDerivedAmounts) {
  useEffect(() => {
    const depositAmount = Number(calculation?.depositAmount) || 0;
    const remainingAmount = Math.max(
      0,
      (Number(calculation?.finalTotalAmount) || 0) - depositAmount
    );
    syncDerivedAmounts({ depositAmount, remainingAmount });
  }, [calculation?.depositAmount, calculation?.finalTotalAmount, syncDerivedAmounts]);
}
