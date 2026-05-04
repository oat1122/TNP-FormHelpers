// Re-export Quotation table styles เพื่อให้ Invoice table มี visual ตรงกัน
// (ป้องกัน drift — ถ้าจะเปลี่ยน design ทำที่ Quotation/utils/tableStyles.js ที่เดียว)
export {
  headCellSx,
  bodyCellSx,
} from "../../../../Quotations/components/QuotationTableView/utils/tableStyles";
