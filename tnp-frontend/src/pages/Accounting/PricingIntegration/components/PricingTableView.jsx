import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo } from "react";

/* ── Status helpers ── */

/* ── shared styles ── */
const headCellSx = {
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.8rem",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  py: 1.8,
  px: 2,
  borderBottom: "none",
  textTransform: "uppercase",
};

const ROW_HEIGHT = 56;

const bodyCellSx = {
  py: 1,
  px: 2,
  fontSize: "0.855rem",
  borderBottom: "1px solid",
  borderColor: "divider",
  height: ROW_HEIGHT,
  verticalAlign: "middle",
  overflow: "hidden",
};

/* ═══════════════════════════════════════════════════
   PricingTableView — table display for grouped pricing requests
   ═══════════════════════════════════════════════════ */
const PricingTableView = ({ data = [], onCreateQuotation, onEditCustomer }) => {
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
      <Table sx={{ minWidth: 900 }}>
        {/* ── Column widths ── */}
        <colgroup>
          <col style={{ width: "5%" }} /> {/* # */}
          <col style={{ width: "28%" }} /> {/* ชื่อบริษัท */}
          <col style={{ width: "22%" }} /> {/* ชื่อผู้ติดต่อ */}
          <col style={{ width: "10%" }} /> {/* จำนวนงาน */}
          <col style={{ width: "20%" }} /> {/* งาน PR */}
          <col style={{ width: "15%" }} /> {/* จัดการ */}
        </colgroup>

        <TableHead>
          <TableRow
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>#</TableCell>
            <TableCell sx={headCellSx}>ชื่อบริษัท</TableCell>
            <TableCell sx={headCellSx}>ชื่อผู้ติดต่อ</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>จำนวนงาน</TableCell>
            <TableCell sx={headCellSx}>งาน PR (ล่าสุด)</TableCell>
            <TableCell sx={{ ...headCellSx, textAlign: "center" }}>จัดการ</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                ไม่พบข้อมูล
              </TableCell>
            </TableRow>
          )}

          {data.map((group, idx) => {
            const customer = group.customer || {};
            const companyName = customer.cus_company || "ไม่ระบุบริษัท";
            const contactName =
              [customer.cus_firstname, customer.cus_lastname].filter(Boolean).join(" ") ||
              "ไม่ระบุชื่อ";

            // Latest 2 PR numbers to display
            const latestPRs = (group.requests || []).slice(0, 2);

            return (
              <TableRow
                key={group._customerId}
                hover
                sx={{
                  bgcolor: idx % 2 === 0 ? "transparent" : "action.hover",
                  "&:hover": { bgcolor: "primary.50" },
                  transition: "background-color 0.15s ease",
                  height: ROW_HEIGHT,
                }}
              >
                {/* # */}
                <TableCell sx={{ ...bodyCellSx, textAlign: "center", color: "text.secondary" }}>
                  {idx + 1}
                </TableCell>

                {/* ชื่อบริษัท */}
                <TableCell sx={bodyCellSx}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 280,
                    }}
                  >
                    {companyName}
                  </Typography>
                </TableCell>

                {/* ชื่อผู้ติดต่อ */}
                <TableCell sx={bodyCellSx}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                    }}
                  >
                    {contactName}
                  </Typography>
                </TableCell>

                {/* จำนวนงาน */}
                <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
                  <Chip
                    label={`${group.total_count} งาน`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: "0.75rem", height: 24 }}
                  />
                  {group.quoted_count > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "warning.main", mt: 0.3, fontSize: "0.7rem" }}
                    >
                      มีใบเสนอราคา {group.quoted_count}
                    </Typography>
                  )}
                </TableCell>

                {/* งาน PR (ล่าสุด) */}
                <TableCell sx={bodyCellSx}>
                  <Box sx={{ overflow: "hidden", maxHeight: ROW_HEIGHT - 16 }}>
                    {latestPRs.slice(0, 1).map((req) => (
                      <Typography
                        key={req.pr_id}
                        variant="caption"
                        noWrap
                        sx={{
                          color: "primary.main",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          display: "block",
                          maxWidth: 200,
                        }}
                      >
                        #{req.pr_no || req.pr_number || "N/A"}{" "}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "text.secondary", fontSize: "0.72rem" }}
                        >
                          {req.pr_work_name || ""}
                        </Typography>
                      </Typography>
                    ))}
                    {(group.requests || []).length > 1 && (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.disabled", fontSize: "0.7rem" }}
                      >
                        +{group.requests.length - 1} อื่นๆ
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* จัดการ */}
                <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
                  <Box sx={{ display: "inline-flex", gap: 0.5, alignItems: "center" }}>
                    <Tooltip title="แก้ไขลูกค้า" arrow>
                      <IconButton
                        size="small"
                        onClick={() => onEditCustomer?.(group)}
                        sx={{ color: "text.secondary" }}
                      >
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip
                      title={group.is_quoted ? "สร้างใบเสนอราคาแล้วทั้งหมด" : "สร้างใบเสนอราคา"}
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={group.is_quoted}
                          onClick={() => onCreateQuotation?.(group)}
                          sx={{ color: group.is_quoted ? undefined : "primary.main" }}
                        >
                          <AssignmentIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default memo(PricingTableView);
