export function calcPrintPoints(detail) {
  if (!detail) return 0;
  return detail.blocks ? detail.blocks.length : 0;
}
