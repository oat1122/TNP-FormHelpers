// Shared sanitizers to keep typing smooth across forms/dialogs
export const sanitizeInt = (val) => {
  if (val == null) return "";
  let s = String(val);
  // อนุญาตให้พิมพ์ตัวเลขได้อย่างเดียว แต่ไม่ลบทันที เพื่อให้การพิมพ์ราบรื่น
  s = s.replace(/[^0-9]/g, "");
  return s;
};

export const sanitizeDecimal = (val) => {
  if (val == null) return "";
  let s = String(val);

  // แทนที่คอมม่าด้วยจุด
  s = s.replace(/,/g, ".");

  // อนุญาตเฉพาะตัวเลขและจุดทศนิยม
  s = s.replace(/[^0-9.]/g, "");

  // ตรวจสอบจุดทศนิยม - อนุญาตเฉพาะจุดเดียว
  const parts = s.split(".");
  if (parts.length <= 1) return s;

  // ถ้ามีจุดมากกว่า 1 จุด ให้เก็บแค่จุดแรก
  return `${parts[0]}.${parts.slice(1).join("").replace(/\./g, "")}`;
};

/**
 * Input handler ที่อนุญาตให้พิมพ์ได้อย่างราบรื่น สำหรับตัวเลขจำนวนเต็ม
 */
export const createIntegerInputHandler = (onChange) => (e) => {
  const value = e.target.value;
  const sanitized = sanitizeInt(value);
  onChange(sanitized);
};

/**
 * Input handler ที่อนุญาตให้พิมพ์ได้อย่างราบรื่น สำหรับตัวเลขทศนิยม
 */
export const createDecimalInputHandler = (onChange) => (e) => {
  const value = e.target.value;
  const sanitized = sanitizeDecimal(value);
  onChange(sanitized);
};
