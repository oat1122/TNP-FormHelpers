import { useEffect, useState } from "react";

/**
 * Hook คุม active tab ของ "ก่อน-หลัง" — sync ตาม depositMode ที่ backend คำนวณ
 * ทุกครั้งที่ depositMode เปลี่ยน.
 */
export function useActiveSideTab(depositMode) {
  const [activeSideTab, setActiveSideTab] = useState(depositMode || "before");
  useEffect(() => {
    setActiveSideTab(depositMode || "before");
  }, [depositMode]);
  return { activeSideTab, setActiveSideTab };
}
