/**
 * Component for displaying customer information with snapshot support
 */

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import { truncateText } from "../utils/invoiceFormatters";

const CustomerInfoSection = ({ invoice }) => {
  // ใช้ข้อมูลจาก customer_snapshot หากมี - ตรวจสอบประเภทข้อมูลก่อน
  let customerSnapshot = null;
  if (invoice?.customer_snapshot) {
    try {
      if (typeof invoice.customer_snapshot === "string") {
        customerSnapshot = JSON.parse(invoice.customer_snapshot);
      } else if (typeof invoice.customer_snapshot === "object") {
        customerSnapshot = invoice.customer_snapshot;
      }
    } catch (error) {
      customerSnapshot = null;
    }
  }

  // Priority: invoice overrides -> master customer relation -> snapshot (fallback only)
  const displayCompanyName =
    invoice?.customer_company ||
    invoice?.customer?.cus_company ||
    customerSnapshot?.customer_company ||
    "บริษัท/ลูกค้า";
  const displayAddress =
    invoice?.customer_address ||
    invoice?.customer?.cus_address ||
    customerSnapshot?.customer_address ||
    invoice?.customer_address;
  const displayTaxId =
    invoice?.customer_tax_id ||
    invoice?.customer?.cus_tax_id ||
    customerSnapshot?.customer_tax_id ||
    invoice?.customer_tax_id;
  const displayEmail =
    invoice?.customer_email ||
    invoice?.customer?.cus_email ||
    customerSnapshot?.customer_email ||
    invoice?.customer_email;
  const displayPhone =
    invoice?.customer_tel_1 ||
    invoice?.customer?.cus_tel_1 ||
    customerSnapshot?.customer_tel_1 ||
    invoice?.customer_tel_1;
  const displayFirstName =
    invoice?.customer_firstname ||
    invoice?.customer?.cus_firstname ||
    customerSnapshot?.customer_firstname ||
    invoice?.customer_firstname;
  const displayLastName =
    invoice?.customer_lastname ||
    invoice?.customer?.cus_lastname ||
    customerSnapshot?.customer_lastname ||
    invoice?.customer_lastname;
  const displayContactName = [displayFirstName, displayLastName].filter(Boolean).join(" ") || "-";

  // ชื่อบริษัทแบบตัดข้อความ - แก้ไขที่อยู่ซ้ำ
  const rawCompanyName = displayCompanyName || displayAddress || "บริษัท/ลูกค้า";
  const cleanCompanyName = rawCompanyName.replace(/(\d+)\s+\1/g, "$1"); // แก้ "10240 10240" เป็น "10240"
  const truncatedCompanyName = truncateText(cleanCompanyName, 35);

  // ข้อมูลผู้ขาย/ผู้ดูแล
  const managerUsername = invoice?.manager?.username || "ไม่ระบุ";
  const managerFullName =
    [invoice?.manager?.user_firstname, invoice?.manager?.user_lastname].filter(Boolean).join(" ") ||
    null;
  const managerDisplay = managerFullName
    ? `${managerUsername} (${managerFullName})`
    : managerUsername;

  return (
    <Box mb={2.5}>
      <Stack spacing={1.25}>
        {!!displayContactName && displayContactName !== "-" && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PersonIcon fontSize="small" color="primary" aria-hidden="true" />
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: "0.95rem",
                lineHeight: 1.45,
              }}
            >
              {displayContactName}
            </Typography>
          </Stack>
        )}

        {managerDisplay && managerDisplay !== "ไม่ระบุ" && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AccountBoxIcon fontSize="small" color="action" aria-hidden="true" />
            <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.45 }}>
              <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
                ผู้ขาย:
              </Box>{" "}
              <Box component="span" sx={{ color: "text.secondary" }}>
                {managerDisplay}
              </Box>
            </Typography>
          </Stack>
        )}

        {/* ข้อมูลเพิ่มเติม */}
        {(displayTaxId || displayEmail || displayPhone) && (
          <Box sx={{ ml: 4, mt: 1 }}>
            <Stack spacing={0.5}>
              {displayTaxId && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem", lineHeight: 1.45 }}
                >
                  เลขประจำตัวผู้เสียภาษี: {displayTaxId}
                </Typography>
              )}
              {displayEmail && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem", lineHeight: 1.45 }}
                >
                  Email: {displayEmail}
                </Typography>
              )}
              {displayPhone && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem", lineHeight: 1.45 }}
                >
                  โทร: {displayPhone}
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export { CustomerInfoSection, truncateText as getCleanCompanyName };
