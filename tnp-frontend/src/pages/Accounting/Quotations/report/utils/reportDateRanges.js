import {
  addMonths,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";

export const DATE_PRESETS = ["today", "week", "month", "quarter", "year", "custom"];

// Resolve a preset to a concrete { start, end } range. `month` honours `refDate`
// so prev/next navigation works; other presets always anchor to "now".
export function presetRange(preset, refDate = new Date()) {
  const now = new Date();
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
    case "quarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return null;
  }
}

export function shiftMonth(date, delta) {
  return delta < 0 ? subMonths(date, Math.abs(delta)) : addMonths(date, delta);
}

// Human-readable Thai label between the prev/next arrows. Collapses to the
// shortest representation when the range falls within a single day/month/year.
export function formatDisplayLabel(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return "กำลังโหลด...";

  const start = dateFrom;
  const end = dateTo;
  const isSameDay =
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  const isSameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const isSameYear = start.getFullYear() === end.getFullYear();

  if (isSameDay) return format(start, "d MMM yyyy", { locale: th });
  if (isSameMonth && start.getDate() === 1 && end.getDate() === endOfMonth(start).getDate()) {
    return format(start, "MMMM yyyy", { locale: th });
  }
  if (isSameYear) {
    return `${format(start, "d MMM", { locale: th })} - ${format(end, "d MMM yyyy", { locale: th })}`;
  }
  return `${format(start, "d MMM yyyy", { locale: th })} - ${format(end, "d MMM yyyy", { locale: th })}`;
}
