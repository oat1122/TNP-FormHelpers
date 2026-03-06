import React, { useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Skeleton,
} from "@mui/material";

const STATUS_CONFIG = {
  approved: { label: "อนุมัติแล้ว", color: "success" },
  pending_review: { label: "รอตรวจสอบ", color: "warning" },
  draft: { label: "แบบร่าง", color: "default" },
  completed: { label: "เสร็จสิ้น", color: "info" },
  rejected: { label: "ยกเลิก", color: "error" },
  sent: { label: "ส่งแล้ว", color: "secondary" },
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const COLS = [
  { id: "no", label: "#", width: 44, align: "center" },
  { id: "number", label: "เลขที่เอกสาร", width: 160 },
  { id: "document_date", label: "วันที่", width: 110 },
  { id: "customer_name", label: "ชื่อลูกค้า", minWidth: 140 },
  { id: "work_name", label: "ชื่อโปรเจ็ค", minWidth: 120 },
  { id: "salesperson", label: "พนักงานขาย", width: 120 },
  { id: "subtotal", label: "มูลค่า", width: 110, align: "right" },
  { id: "tax_amount", label: "VAT", width: 90, align: "right" },
  { id: "final_total_amount", label: "ยอดรวม", width: 120, align: "right", bold: true },
  { id: "status", label: "สถานะ", width: 130, align: "center" },
];

const ReportTableView = ({ data = [], isLoading = false }) => {
  const totals = useMemo(() => {
    const rows = data.filter((r) => r.status !== "rejected");
    return {
      subtotal: rows.reduce((s, r) => s + Number(r.subtotal || 0), 0),
      tax_amount: rows.reduce((s, r) => s + Number(r.tax_amount || 0), 0),
      final_total_amount: rows.reduce((s, r) => s + Number(r.final_total_amount || 0), 0),
    };
  }, [data]);

  const headerSx = {
    bgcolor: "primary.main",
    color: "white",
    fontWeight: 700,
    fontSize: "0.78rem",
    whiteSpace: "nowrap",
    py: 1.5,
    borderRight: "1px solid rgba(255,255,255,0.15)",
  };

  if (isLoading) {
    return (
      <Box>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
        <Typography variant="body1">ไม่มีข้อมูลในช่วงเวลาที่เลือก</Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid", borderColor: "divider", borderRadius: "0 0 8px 8px" }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {COLS.map((col) => (
              <TableCell
                key={col.id}
                align={col.align || "left"}
                sx={{ ...headerSx, width: col.width, minWidth: col.minWidth }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((row, i) => {
            const sc = STATUS_CONFIG[row.status] || { label: row.status, color: "default" };
            return (
              <TableRow
                key={row.id || i}
                hover
                sx={{
                  "&:nth-of-type(even)": { bgcolor: "action.hover" },
                  opacity: row.status === "rejected" ? 0.6 : 1,
                }}
              >
                <TableCell align="center" sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  {i + 1}
                </TableCell>
                <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600, color: "primary.main" }}>
                  {row.number || "-"}
                </TableCell>
                <TableCell sx={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                  {fmtDate(row.document_date)}
                </TableCell>
                <TableCell sx={{ fontSize: "0.82rem" }}>
                  <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                    {row.customer_name || "-"}
                  </Typography>
                  {row.tax_id && String(row.tax_id).toLowerCase() !== "null" && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {row.tax_id}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: "0.82rem" }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                    {row.work_name || "-"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: "0.82rem" }}>{row.salesperson || "-"}</TableCell>
                <TableCell align="right" sx={{ fontSize: "0.82rem", fontFamily: "monospace" }}>
                  {fmt(row.subtotal)}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: "0.82rem", fontFamily: "monospace" }}>
                  {fmt(row.tax_amount)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontSize: "0.85rem", fontFamily: "monospace", fontWeight: 700 }}
                >
                  {fmt(row.final_total_amount)}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={sc.label}
                    color={sc.color}
                    size="small"
                    sx={{ fontSize: "0.72rem", height: 22 }}
                  />
                </TableCell>
              </TableRow>
            );
          })}

          {/* Summary Footer */}
          <TableRow sx={{ bgcolor: "grey.100", borderTop: "2px solid", borderColor: "divider" }}>
            <TableCell colSpan={6} align="right" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
              ยอดรวม ({data.filter((r) => r.status !== "rejected").length} รายการ)
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: 700, fontSize: "0.85rem", fontFamily: "monospace" }}
            >
              {fmt(totals.subtotal)}
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: 700, fontSize: "0.85rem", fontFamily: "monospace" }}
            >
              {fmt(totals.tax_amount)}
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 700,
                fontSize: "0.9rem",
                fontFamily: "monospace",
                color: "success.main",
              }}
            >
              {fmt(totals.final_total_amount)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ReportTableView;
