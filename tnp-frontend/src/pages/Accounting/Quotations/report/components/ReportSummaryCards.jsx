import React from "react";
import { Box, Card, CardContent, Typography, Stack, Divider } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SummarizeIcon from "@mui/icons-material/Summarize";

const fmt = (n) =>
  Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SummaryCard = ({ icon: Icon, label, value, color, sub }) => (
  <Card
    elevation={0}
    sx={{
      flex: 1,
      minWidth: 180,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      transition: "box-shadow .2s",
      "&:hover": { boxShadow: 3 },
    }}
  >
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: `${color}.50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color: `${color}.main`, fontSize: 22 }} />
        </Box>
        <Typography variant="caption" color="text.secondary" fontWeight={500} lineHeight={1.2}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" fontWeight={700} color={`${color}.main`}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const ReportSummaryCards = ({ summary = {} }) => {
  const cards = [
    {
      icon: AssignmentIcon,
      label: "จำนวนเอกสาร",
      value: `${Number(summary.count || 0).toLocaleString()} รายการ`,
      color: "primary",
    },
    {
      icon: AccountBalanceWalletIcon,
      label: "มูลค่าก่อน VAT",
      value: `฿${fmt(summary.subtotal)}`,
      color: "info",
    },
    {
      icon: ReceiptIcon,
      label: "ภาษีมูลค่าเพิ่ม",
      value: `฿${fmt(summary.tax_amount)}`,
      color: "warning",
    },
    {
      icon: SummarizeIcon,
      label: "ยอดรวมสุทธิ",
      value: `฿${fmt(summary.total_amount)}`,
      color: "success",
      sub: "รวม VAT (ไม่นับรายที่ยกเลิก)",
    },
  ];

  return (
    <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
      {cards.map((c) => (
        <SummaryCard key={c.label} {...c} />
      ))}
    </Stack>
  );
};

export default ReportSummaryCards;
