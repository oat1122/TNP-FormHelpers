import { tokens } from "../../../../shared/styles/quotationFormStyles";

// Header cell styling — gradient row in QuotationTableView main shell.
export const headCellSx = {
  color: tokens.white,
  fontWeight: 700,
  fontSize: "0.8rem",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  py: 1.8,
  px: 2,
  borderBottom: "none",
  textTransform: "uppercase",
};

export const bodyCellSx = {
  py: 1.6,
  px: 2,
  fontSize: "0.855rem",
  borderBottom: "1px solid",
  borderColor: "divider",
};
