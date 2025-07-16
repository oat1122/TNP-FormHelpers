import React from "react";
import {
  Box,
  Typography,
  Grid2 as Grid,
  Paper,
  Divider,
  Chip,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import {
  MdVerifiedUser,
  MdBusiness,
  MdPerson,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdReceiptLong,
  MdNotes,
  MdSupervisorAccount,
  MdCheckCircle,
  MdWarning,
} from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";
const LIGHT_RED = "#E36264";
const GREY_MAIN = "#EBEBEB";

/**
 * VerificationStep - ขั้นตอนที่ 4: การยืนยัน
 */
const VerificationStep = ({
  inputList = {},
  businessTypesList = [],
  salesList = [],
  provincesList = [],
  districtList = [],
  subDistrictList = [],
  mode = "create",
}) => {
  // Helper functions
  const getBusinessTypeName = () => {
    const businessType = businessTypesList.find(
      (type) => type.bt_id === inputList.cus_bt_id
    );
    return businessType ? businessType.bt_name : "ไม่ระบุ";
  };

  const getSalesName = () => {
    if (inputList.cus_manage_by?.user_id) {
      const sales = salesList.find(
        (s) => s.user_id === inputList.cus_manage_by.user_id
      );
      return sales ? sales.username : "ไม่ระบุ";
    }
    return inputList.cus_manage_by?.username || "ไม่ระบุ";
  };

  const getLocationName = (type, id) => {
    let list = [];
    if (type === "province") list = provincesList;
    else if (type === "district") list = districtList;
    else if (type === "subdistrict") list = subDistrictList;

    const item = list.find((l) => l[`${type.substring(0, 3)}_id`] === id);
    return item ? item[`${type.substring(0, 3)}_name`] : "ไม่ระบุ";
  };

  const getChannelText = (channel) => {
    const channels = {
      facebook: "Facebook",
      instagram: "Instagram",
      line: "Line",
      google: "Google Search",
      friend: "เพื่อน/คนรู้จัก",
      customer: "ลูกค้าเก่า",
      other: "อื่นๆ",
    };
    return channels[channel] || channel || "ไม่ระบุ";
  };

  // Check required fields
  const requiredFields = [
    "cus_company",
    "cus_firstname",
    "cus_lastname",
    "cus_name",
    "cus_bt_id",
    "cus_tel_1",
    "cus_address",
    "cus_pro_id",
    "cus_dis_id",
    "cus_sub_id",
  ];

  const missingFields = requiredFields.filter((field) => {
    const value = inputList[field];
    return !value || value === "";
  });

  const isComplete = missingFields.length === 0;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: 2 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: `2px solid ${PRIMARY_RED}`,
          borderRadius: 2,
          background: `linear-gradient(45deg, ${PRIMARY_RED}05, ${PRIMARY_RED}10)`,
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

      {/* Status indicator */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: `2px solid ${isComplete ? PRIMARY_RED : LIGHT_RED}`,
          borderRadius: 2,
          backgroundColor: isComplete ? `${PRIMARY_RED}05` : `${LIGHT_RED}05`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {isComplete ? (
            <MdCheckCircle size={24} color={PRIMARY_RED} />
          ) : (
            <MdWarning size={24} color={LIGHT_RED} />
          )}
          <Box flex={1}>
            <Typography
              variant="h6"
              fontFamily="Kanit"
              color={isComplete ? PRIMARY_RED : LIGHT_RED}
            >
              {isComplete ? "ข้อมูลครบถ้วน พร้อมบันทึก" : "ข้อมูลยังไม่ครบถ้วน"}
            </Typography>
            {!isComplete && (
              <Typography
                variant="body2"
                color="text.secondary"
                fontFamily="Kanit"
              >
                กรุณาตรวจสอบและกรอกข้อมูลที่ขาดหายให้ครบถ้วน
              </Typography>
            )}
          </Box>
        </Box>

        {!isComplete && (
          <Box mt={2}>
            <Typography
              variant="body2"
              fontFamily="Kanit"
              color={LIGHT_RED}
              fontWeight={500}
              mb={1}
            >
              ข้อมูลที่ยังขาดหาย:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {missingFields.map((field) => {
                const fieldNames = {
                  cus_company: "ชื่อบริษัท",
                  cus_firstname: "ชื่อผู้ติดต่อ",
                  cus_lastname: "นามสกุลลูกค้า",
                  cus_name: "ชื่อเล่น",
                  cus_bt_id: "ประเภทธุรกิจ",
                  cus_tel_1: "เบอร์โทรหลัก",
                  cus_address: "ที่อยู่",
                  cus_pro_id: "จังหวัด",
                  cus_dis_id: "อำเภอ/เขต",
                  cus_sub_id: "ตำบล/แขวง",
                };
                return (
                  <Chip
                    key={field}
                    label={fieldNames[field] || field}
                    size="small"
                    sx={{
                      backgroundColor: LIGHT_RED,
                      color: "white",
                      fontFamily: "Kanit",
                      fontSize: "0.75rem",
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* ข้อมูลธุรกิจ */}
        <Grid xs={12} md={6}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <MdBusiness size={20} color={PRIMARY_RED} />
                <Typography
                  variant="h6"
                  fontWeight={500}
                  color={PRIMARY_RED}
                  fontFamily="Kanit"
                >
                  ข้อมูลธุรกิจ
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    ประเภทธุรกิจ
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {getBusinessTypeName()}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    ชื่อบริษัท
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {inputList.cus_company || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    ชื่อเล่น
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {inputList.cus_name || "-"}
                  </Typography>
                </Box>

                {inputList.cus_tax_id && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      เลขประจำตัวผู้เสียภาษี
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MdReceiptLong size={16} color={PRIMARY_RED} />
                      <Typography
                        variant="body2"
                        fontFamily="Kanit"
                        fontWeight={500}
                      >
                        {inputList.cus_tax_id}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ข้อมูลผู้ติดต่อ */}
        <Grid xs={12} md={6}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <MdPerson size={20} color={PRIMARY_RED} />
                <Typography
                  variant="h6"
                  fontWeight={500}
                  color={PRIMARY_RED}
                  fontFamily="Kanit"
                >
                  ข้อมูลผู้ติดต่อ
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    ชื่อ-นามสกุล
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {`${inputList.cus_firstname || ""} ${
                      inputList.cus_lastname || ""
                    }`.trim() || "-"}
                  </Typography>
                </Box>

                {inputList.cus_depart && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      ตำแหน่ง
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Kanit"
                      fontWeight={500}
                    >
                      {inputList.cus_depart}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    เบอร์โทรหลัก
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MdPhone size={16} color={PRIMARY_RED} />
                    <Typography
                      variant="body2"
                      fontFamily="Kanit"
                      fontWeight={500}
                    >
                      {inputList.cus_tel_1 || "-"}
                    </Typography>
                  </Box>
                </Box>

                {inputList.cus_tel_2 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      เบอร์โทรสำรอง
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MdPhone size={16} color={PRIMARY_RED} />
                      <Typography
                        variant="body2"
                        fontFamily="Kanit"
                        fontWeight={500}
                      >
                        {inputList.cus_tel_2}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {inputList.cus_email && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      อีเมล
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MdEmail size={16} color={PRIMARY_RED} />
                      <Typography
                        variant="body2"
                        fontFamily="Kanit"
                        fontWeight={500}
                      >
                        {inputList.cus_email}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {inputList.cus_channel && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      ช่องทางการรู้จัก
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Kanit"
                      fontWeight={500}
                    >
                      {getChannelText(inputList.cus_channel)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ที่อยู่ */}
        <Grid xs={12} md={6}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <MdLocationOn size={20} color={PRIMARY_RED} />
                <Typography
                  variant="h6"
                  fontWeight={500}
                  color={PRIMARY_RED}
                  fontFamily="Kanit"
                >
                  ที่อยู่
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    ที่อยู่เต็ม
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {inputList.cus_address || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    ตำบล/แขวง
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {getLocationName("subdistrict", inputList.cus_sub_id)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    อำเภอ/เขต
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {getLocationName("district", inputList.cus_dis_id)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    จังหวัด
                  </Typography>
                  <Typography
                    variant="body2"
                    fontFamily="Kanit"
                    fontWeight={500}
                  >
                    {getLocationName("province", inputList.cus_pro_id)}
                  </Typography>
                </Box>

                {inputList.cus_zip_code && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      รหัสไปรษณีย์
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Kanit"
                      fontWeight={500}
                    >
                      {inputList.cus_zip_code}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ข้อมูลเพิ่มเติม */}
        <Grid xs={12} md={6}>
          <Card elevation={1} sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <MdNotes size={20} color={PRIMARY_RED} />
                <Typography
                  variant="h6"
                  fontWeight={500}
                  color={PRIMARY_RED}
                  fontFamily="Kanit"
                >
                  ข้อมูลเพิ่มเติม
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Kanit"
                  >
                    ผู้ดูแลลูกค้า
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MdSupervisorAccount size={16} color={PRIMARY_RED} />
                    <Typography
                      variant="body2"
                      fontFamily="Kanit"
                      fontWeight={500}
                    >
                      {getSalesName()}
                    </Typography>
                  </Box>
                </Box>

                {inputList.cd_note && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      หมายเหตุ
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Kanit"
                      fontWeight={500}
                    >
                      {inputList.cd_note}
                    </Typography>
                  </Box>
                )}

                {inputList.cd_remark && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontFamily="Kanit"
                    >
                      ข้อมูลเพิ่มเติม
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Kanit"
                      fontWeight={500}
                    >
                      {inputList.cd_remark}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VerificationStep;
