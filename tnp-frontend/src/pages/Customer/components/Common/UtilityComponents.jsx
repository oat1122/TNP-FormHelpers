import { Box, Typography, FormControl, Select, MenuItem } from "@mui/material";

// Component สำหรับเลือกจำนวน rows ต่อหน้า
export const PageSizeSelector = ({ value, onChange }) => {
  const pageSizeOptions = [30, 50, 80, 100];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ color: (theme) => theme.vars.palette.grey.dark }}>
        Rows per page:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 85 }}>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          variant="outlined"
          sx={{
            borderRadius: 1,
            backgroundColor: (theme) => theme.vars.palette.grey.outlinedInput,
            ".MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "transparent",
            },
            ".MuiSelect-select": { py: 0.5, px: 1 },
          }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option} rows
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

// Component แสดงข้อมูลการเรียงลำดับ
export const SortInfoDisplay = ({ sortModel }) => {
  if (!sortModel || sortModel.length === 0) {
    return null;
  }

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

  const SortIcon =
    sort === "asc"
      ? () => <span style={{ fontSize: "0.8em", marginRight: "4px" }}>▲</span>
      : () => <span style={{ fontSize: "0.8em", marginRight: "4px" }}>▼</span>;

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
};

// Component เมื่อไม่พบข้อมูล
export const NoDataComponent = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "gray",
      padding: 5,
      gap: 2,
      backgroundColor: (theme) => `${theme.palette.grey.light}33`,
      borderRadius: 2,
    }}
  >
    <Box
      sx={{
        fontSize: 60,
        opacity: 0.5,
        animation: "subtle-pulse 2s infinite ease-in-out",
      }}
    >
      📋
    </Box>
    <Typography sx={{ fontSize: 18, fontWeight: "medium" }}>ไม่พบข้อมูลลูกค้า</Typography>
    <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 300, opacity: 0.7 }}>
      ลองใช้ตัวกรองอื่น หรือลองค้นหาด้วยคำสำคัญอื่น
    </Typography>
  </Box>
);

// Mapping ข้อมูลช่องทาง
export const channelMap = {
  1: "sales",
  2: "online",
  3: "office",
};
