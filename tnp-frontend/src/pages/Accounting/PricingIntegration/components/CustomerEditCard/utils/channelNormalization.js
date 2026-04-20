const SALES_VALUES = new Set(["sales", "sale", "ฝ่ายขาย", "เซลส์", "เซล", "ขาย"]);
const ONLINE_VALUES = new Set([
  "online",
  "on-line",
  "ออนไลน์",
  "website",
  "web",
  "facebook",
  "ig",
  "line",
  "ไลน์",
  "เพจ",
]);
const OFFICE_VALUES = new Set([
  "office",
  "walk-in",
  "walkin",
  "หน้าร้าน",
  "ออฟฟิศ",
  "สาขา",
  "หน้าสำนักงาน",
]);

export const normalizeChannelValue = (raw) => {
  if (raw === null || raw === undefined) return "";
  const v = typeof raw === "string" ? raw.trim() : raw;
  if (v === "") return "";
  if (v === "1" || v === "2" || v === "3") return String(v);

  const lower = String(v).toLowerCase();
  if (SALES_VALUES.has(lower)) return "1";
  if (ONLINE_VALUES.has(lower)) return "2";
  if (OFFICE_VALUES.has(lower)) return "3";

  const num = Number(v);
  if (Number.isFinite(num)) {
    if (num >= 1 && num <= 3) return String(num);
    if (num === 0) return "";
  }
  return "";
};
