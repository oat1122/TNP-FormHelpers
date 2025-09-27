// Shared sanitizers to keep typing smooth across forms/dialogs
export const sanitizeInt = (val) => {
  if (val == null) return "";
  let s = String(val);
  s = s.replace(/\D+/g, "");
  return s;
};

export const sanitizeDecimal = (val) => {
  if (val == null) return "";
  let s = String(val).replace(/,/g, ".");
  s = s.replace(/[^0-9.]/g, "");
  const parts = s.split(".");
  if (parts.length <= 1) return s;
  return `${parts[0]}.${parts.slice(1).join("").replace(/\./g, "")}`;
};
