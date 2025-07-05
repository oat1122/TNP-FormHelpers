import { Box, Typography } from "@mui/material";

export default function SortInfoDisplay({ sortModel }) {
  if (!sortModel || sortModel.length === 0) return null;

  const fieldMap = {
    cus_no: "รหัสลูกค้า",
    cus_channel: "ช่องทาง",
    cus_bt_id: "ประเภทธุรกิจ",
    business_type: "ประเภทธุรกิจ",
    cus_manage_by: "ชื่อเซลล์",
    cus_name: "ชื่อลูกค้า",
    cus_company: "ชื่อบริษัท",
    cus_tel_1: "เบอร์โทร",
    cd_last_datetime: "วันติดต่อกลับ",
    cd_note: "หมายเหตุ",
    cus_email: "อีเมล",
    cus_address: "ที่อยู่",
  };

  const { field, sort } = sortModel[0];
  const displayField = fieldMap[field] || field;
  const displayDirection = sort === "asc" ? "ascending" : "descending";
  const SortIcon = sort === "asc" ? () => <span style={{ fontSize: '0.8em', marginRight: 4 }}>▲</span>
                                 : () => <span style={{ fontSize: '0.8em', marginRight: 4 }}>▼</span>;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        padding: "4px 8px",
        borderRadius: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        color: "white",
      }}
    >
      <SortIcon />
      <Typography variant="caption" sx={{ fontWeight: "medium" }}>
        เรียงตาม: {displayField} ({displayDirection === "ascending" ? "น้อยไปมาก" : "มากไปน้อย"})
      </Typography>
    </Box>
  );
}
