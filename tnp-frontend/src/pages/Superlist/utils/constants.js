// UI Colors
export const PRIMARY_RED = "#C1272D";

// Currency options
export const CURRENCIES = [
  { code: "THB", label: "THB - บาท" },
  { code: "USD", label: "USD - ดอลลาร์สหรัฐ" },
  { code: "EUR", label: "EUR - ยูโร" },
  { code: "GBP", label: "GBP - ปอนด์" },
  { code: "JPY", label: "JPY - เยน" },
  { code: "CNY", label: "CNY - หยวน" },
  { code: "KRW", label: "KRW - วอน" },
  { code: "SGD", label: "SGD - ดอลลาร์สิงคโปร์" },
  { code: "MYR", label: "MYR - ริงกิต" },
  { code: "VND", label: "VND - ด่อง" },
];

// Default price tiers
export const DEFAULT_TIERS = [
  { min_qty: 1, max_qty: 99, discount: 0 },
  { min_qty: 100, max_qty: 499, discount: 5 },
  { min_qty: 500, max_qty: 999, discount: 10 },
  { min_qty: 1000, max_qty: 4999, discount: 15 },
  { min_qty: 5000, max_qty: null, discount: 20 },
];

// Country options
export const COUNTRY_OPTIONS = [
  { value: "", label: "-- ไม่ระบุ --" },
  { value: "ไทย", label: "ไทย" },
  { value: "ต่างประเทศ", label: "ต่างประเทศ" },
];

// Sort options
export const SORT_OPTIONS = [
  { value: "created_at_desc", label: "ใหม่ล่าสุด" },
  { value: "created_at_asc", label: "เก่าสุด" },
  { value: "sp_name_asc", label: "ชื่อ A-Z" },
  { value: "sp_name_desc", label: "ชื่อ Z-A" },
  { value: "sp_price_thb_asc", label: "ราคาน้อย-มาก" },
  { value: "sp_price_thb_desc", label: "ราคามาก-น้อย" },
];

// Default unit
export const DEFAULT_UNIT = "ชิ้น";
