export const formatDateTH = (date) =>
  date
    ? new Date(date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
    : "";

export default formatDateTH;
