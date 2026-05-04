import { Box, Tooltip } from "@mui/material";

/**
 * Top-right colored dot indicating invoice status:
 * - success (green): มีหลักฐานการชำระเงิน
 * - warning (yellow): อนุมัติแล้ว แต่ยังไม่มีหลักฐาน
 * - hidden: ยังเป็น draft
 */
const StatusIndicatorDot = ({ approved, hasEvidence }) => {
  if (!approved && !hasEvidence) return null;

  return (
    <Tooltip title={hasEvidence ? "มีหลักฐานการชำระเงินแล้ว" : "อนุมัติแล้ว"} placement="left">
      <Box
        aria-label={hasEvidence ? "มีหลักฐานการชำระเงินแล้ว" : "ใบแจ้งหนี้อนุมัติแล้ว"}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 12,
          height: 12,
          borderRadius: "50%",
          bgcolor: hasEvidence ? "success.main" : "warning.main",
          border: "2px solid #fff",
          boxShadow: 1,
        }}
      />
    </Tooltip>
  );
};

export default StatusIndicatorDot;
