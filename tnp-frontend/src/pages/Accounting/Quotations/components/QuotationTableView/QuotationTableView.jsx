import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { useQuotationTableActions } from "./hooks/useQuotationTableActions";
import QuotationTableRow from "./subcomponents/QuotationTableRow";
import { headCellSx } from "./utils/tableStyles";

const QuotationTableView = ({
  data = [],
  onViewDetail,
  onDownloadPDF,
  onDuplicate,
  onEdit,
  canEditQuotations = false,
  currentUserRole,
  onCreateInvoice,
  onGoToInvoice,
  onActionSuccess,
}) => {
  const { getCompanyName } = useQuotationTableActions();

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        overflow: "auto",
      }}
    >
      <Table sx={{ minWidth: 1000 }}>
        <colgroup>
          <col style={{ width: "4%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "15%" }} />
        </colgroup>

        <TableHead>
          <TableRow
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>#</TableCell>
            <TableCell sx={headCellSx}>เลขที่เอกสาร</TableCell>
            <TableCell sx={headCellSx}>ชื่อลูกค้า</TableCell>
            <TableCell sx={headCellSx}>บริษัท</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>สถานะ</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "right" }}>ยอดรวม</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>วันที่สร้าง</TableCell>
            <TableCell sx={headCellSx}>ผู้สร้าง</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>จัดการ</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                ไม่พบข้อมูล
              </TableCell>
            </TableRow>
          )}

          {data.map((q, idx) => (
            <QuotationTableRow
              key={q.id}
              q={q}
              idx={idx}
              getCompanyName={getCompanyName}
              onViewDetail={onViewDetail}
              onDownloadPDF={onDownloadPDF}
              onDuplicate={onDuplicate}
              onEdit={onEdit}
              canEditQuotations={canEditQuotations}
              currentUserRole={currentUserRole}
              onCreateInvoice={onCreateInvoice}
              onGoToInvoice={onGoToInvoice}
              onActionSuccess={onActionSuccess}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default QuotationTableView;
