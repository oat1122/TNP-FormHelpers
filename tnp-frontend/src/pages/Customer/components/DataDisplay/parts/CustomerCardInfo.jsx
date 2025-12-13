import React from "react";
import { Box, Typography, IconButton, Stack, useTheme } from "@mui/material";
import {
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

// UI Atoms
import { InfoFieldRow, RecallStatusChip } from "../ui";

// Utils
import {
  datadisplayColors,
  safeExtractValue,
  safeFormatCustomRelativeTime,
  getRecallStatus,
} from "../../../utils/customerCardUtils";

// Dialog utils
import { dialog_delete_by_id as swal_delete_by_id } from "../../../../utils/dialog_swal2/dialog_delete_by_id";
import { open_dialog_error } from "../../../../utils/dialog_swal2/alart_one_line";

/**
 * CustomerCardInfo - ส่วนข้อมูลของ Customer Card
 * รวม Company, Phone, Address, Sales Person, Notes
 * @param {Object} customer - Customer data object
 * @param {Object} parsedAddress - Parsed address object
 * @param {Function} handleRecall - Handler สำหรับ reset recall
 */
const CustomerCardInfo = ({ customer, parsedAddress, handleRecall }) => {
  const theme = useTheme();

  // Calculate recall status
  const relativeRecall = safeFormatCustomRelativeTime(customer.cd_last_datetime);
  const recallStatus = getRecallStatus(customer.cd_last_datetime, relativeRecall);

  // Extract values safely
  const company = safeExtractValue(customer.cus_company, ["name", "company_name"], null);
  const phone = safeExtractValue(customer.cus_tel_1, ["number", "phone"], null);
  const salesPerson = safeExtractValue(customer.cus_manage_by, ["username", "user_name"], null);
  const notes = safeExtractValue(customer.cd_note, ["note", "comment"], null);

  // Handle phone call
  const handlePhoneCall = async (e) => {
    e.stopPropagation();
    if (!phone || phone === "ไม่ระบุ") return;

    try {
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      window.open(`tel:${cleanPhone}`, "_self");

      const confirmed = await swal_delete_by_id(
        `โทรเรียบร้อยแล้ว ต้องการรีเซตเวลานัดของ ${safeExtractValue(customer.cus_name, ["name"], "ลูกค้า")} หรือไม่?`
      );

      if (confirmed && handleRecall) {
        await handleRecall({
          cus_mcg_id: customer.cus_mcg_id,
          cd_id: customer.cd_id,
          cus_name: customer.cus_name,
        });
      }
    } catch (error) {
      console.error("Error in call/recall process:", error);
      open_dialog_error("เกิดข้อผิดพลาดในการดำเนินการ", error);
    }
  };

  return (
    <Stack spacing={1}>
      {/* Company */}
      {company && <InfoFieldRow icon={<BusinessIcon />} text={company} />}

      {/* Phone */}
      {phone && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <InfoFieldRow icon={<PhoneIcon />} text={phone} sx={{ flex: "0 0 auto" }} />

          {/* Call Button */}
          <IconButton
            size="small"
            onClick={handlePhoneCall}
            sx={{
              backgroundColor: datadisplayColors.primary,
              color: "white",
              width: 28,
              height: 28,
              ml: 0.5,
              "&:hover": {
                backgroundColor: datadisplayColors.secondary,
              },
              "&:active": {
                backgroundColor: "#7d0000",
              },
            }}
            title="โทรออก + รีเซตเวลานัด"
          >
            <PhoneIcon sx={{ fontSize: 14 }} />
          </IconButton>

          {/* Recall Status */}
          {customer.cd_last_datetime && (
            <RecallStatusChip recallDate={customer.cd_last_datetime} status={recallStatus} />
          )}
        </Box>
      )}

      {/* Address */}
      {customer.cus_address && parsedAddress?.address && (
        <InfoFieldRow
          icon={<LocationOnIcon />}
          text={`${parsedAddress.address} ${parsedAddress.subdistrict} ${parsedAddress.district} ${parsedAddress.province} ${parsedAddress.zipCode}`.trim()}
          alignTop
        />
      )}

      {/* Sales Person */}
      {salesPerson && <InfoFieldRow icon={<PersonIcon />} text={`ดูแลโดย: ${salesPerson}`} />}

      {/* Notes */}
      {notes && (
        <Box
          sx={{
            bgcolor: datadisplayColors.card.background,
            p: 1,
            borderRadius: 1,
            borderLeft: `3px solid ${datadisplayColors.secondary}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.75rem",
              color: theme.palette.text.secondary,
              fontStyle: "italic",
            }}
          >
            💬 {notes}
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

export default CustomerCardInfo;
