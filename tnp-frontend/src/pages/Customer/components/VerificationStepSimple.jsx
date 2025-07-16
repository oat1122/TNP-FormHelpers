import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { MdVerifiedUser } from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";

/**
 * VerificationStep - ขั้นตอนที่ 4: การยืนยัน (Simple Version)
 */
const VerificationStepSimple = ({ inputList = {}, mode = "create" }) => {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 2 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: `2px solid ${PRIMARY_RED}`,
          borderRadius: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <MdVerifiedUser size={28} color={PRIMARY_RED} />
          <Typography
            variant="h5"
            fontWeight={600}
            color={PRIMARY_RED}
            fontFamily="Kanit"
          >
            การยืนยัน
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" fontFamily="Kanit">
          ตรวจสอบข้อมูลทั้งหมดก่อนบันทึก
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography
            variant="h6"
            fontFamily="Kanit"
            color={PRIMARY_RED}
            mb={2}
          >
            สรุปข้อมูล
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
              >
                ชื่อบริษัท
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" fontWeight={500}>
                {inputList.cus_company || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontFamily="Kanit"
              >
                ชื่อจริงลูกค้า
              </Typography>
              <Typography variant="body2" fontFamily="Kanit" fontWeight={500}>
                {`${inputList.cus_firstname || ""} ${
                  inputList.cus_lastname || ""
                }`.trim() || "-"}
              </Typography>
            </Box>

            {/* Contact Info */}
            <Typography variant="body1" fontFamily="Kanit">
              <strong>เบอร์โทรหลัก:</strong> {inputList.cus_tel_1 || "-"}
            </Typography>
            {inputList.cus_tel_2 && (
              <Typography variant="body1" fontFamily="Kanit">
                <strong>เบอร์โทรสำรอง:</strong> {inputList.cus_tel_2}
              </Typography>
            )}
            <Typography variant="body1" fontFamily="Kanit">
              <strong>อีเมล:</strong> {inputList.cus_email || "-"}
            </Typography>

            {/* Address */}
            <Typography variant="body1" fontFamily="Kanit">
              <strong>ที่อยู่:</strong> {inputList.cus_address || "-"}
            </Typography>

            {inputList.cus_zip_code && (
              <Typography variant="body1" fontFamily="Kanit">
                <strong>รหัสไปรษณีย์:</strong> {inputList.cus_zip_code}
              </Typography>
            )}

            {/* Manager */}
            <Typography variant="body1" fontFamily="Kanit">
              <strong>ผู้ดูแลลูกค้า:</strong>{" "}
              {inputList.cus_manage_by?.username || "ไม่มีผู้ดูแล"}
            </Typography>

            {/* Notes */}
            {inputList.cd_note && (
              <Typography variant="body1" fontFamily="Kanit">
                <strong>หมายเหตุ:</strong> {inputList.cd_note}
              </Typography>
            )}

            {inputList.cd_remark && (
              <Typography variant="body1" fontFamily="Kanit">
                <strong>ข้อมูลเพิ่มเติม:</strong> {inputList.cd_remark}
              </Typography>
            )}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: `${PRIMARY_RED}05`,
            border: `1px solid ${PRIMARY_RED}30`,
          }}
        >
          <Typography
            variant="body2"
            fontFamily="Kanit"
            color={PRIMARY_RED}
            align="center"
          >
            กรุณาตรวจสอบข้อมูลก่อนกดปุ่ม "บันทึก"
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default VerificationStepSimple;
