import { endOfMonth, startOfMonth, subMonths } from "date-fns";

export const DATE_PRESETS = [
  {
    label: "เดือนนี้",
    getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }),
  },
  {
    label: "เดือนที่แล้ว",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: "3 เดือนล่าสุด",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 2)),
      end: endOfMonth(new Date()),
    }),
  },
];
