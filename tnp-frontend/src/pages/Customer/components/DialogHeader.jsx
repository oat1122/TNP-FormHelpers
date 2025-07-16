import React from "react";
import {
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid2 as Grid,
  FormControl,
  InputLabel,
  MenuItem,
  InputAdornment,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import {
  MdClose,
  MdBusiness,
  MdPerson,
  MdSettings,
} from "react-icons/md";
import { StyledTextField, StyledSelect } from "../styles/DialogStyledComponents";
import { titleMap, selectList } from "../constants/dialogConstants";
import { formatCustomRelativeTime } from "../../../features/Customer/customerUtils";

const DialogHeader = ({
  mode,
  inputList,
  salesList,
  businessTypesList,
  isAdmin,
  errors,
  handleInputChange,
  handleOpenBusinessTypeManager,
  handleCloseDialog,
  businessTypesIsFetching,
  setBusinessTypesList,
  businessTypesData,
}) => {
  const formattedRelativeTime = formatCustomRelativeTime(inputList.cd_last_datetime);

  return (
    <>
      {/* Dialog Title - ปรับให้ compact ขึ้น */}
      <DialogTitle
        sx={{
          paddingBlock: 1.5,
          paddingInline: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #B20000 0%, #900F0F 100%)", // สีตาม theme
          color: "white",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {titleMap[mode] + `ข้อมูลลูกค้า`}
          </Typography>
          {mode !== "create" && (
            <Chip
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontWeight: 500,
                ml: 1
              }}
              label={`${formattedRelativeTime} วัน`}
            />
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleCloseDialog}
          sx={{ color: "white" }}
        >
          <MdClose />
        </IconButton>
      </DialogTitle>

      {/* Note Card - ปรับสีตาม theme */}
      {inputList.cd_note && (
        <Card
          variant="outlined"
          sx={{
            mb: 1.5,
            mx: 2,
            borderLeft: "4px solid",
            borderColor: "#B20000", // สีแดงหลักของ theme
            bgcolor: "rgba(178, 0, 0, 0.05)",
          }}
        >
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ color: "#B20000" }}
              >
                ⚠️ หมายเหตุสำคัญ
              </Typography>
            </Box>
            <Typography variant="body2">{inputList.cd_note}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Customer Quick Info Card - ปรับให้ compact สำหรับ sales */}
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 1.5, 
          mx: 2,
          backgroundColor: "#EBEBEB", // สีเทาของ theme
        }}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          {/* Row 1: ข้อมูลหลักที่ sales ต้องกรอกบ่อย */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            {/* ชื่อบริษัท - สำคัญที่สุด */}
            <Grid size={12} md={6}>
              <StyledTextField
                fullWidth
                required
                label="ชื่อบริษัท"
                size="small"
                InputProps={{
                  readOnly: mode === "view",
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdBusiness sx={{ color: "#B20000" }} />
                    </InputAdornment>
                  ),
                }}
                name="cus_company"
                placeholder="เช่น บริษัท ธนพลัส 153 จำกัด"
                value={inputList.cus_company || ""}
                onChange={handleInputChange}
                error={!!errors.cus_company}
                helperText={errors.cus_company}
                sx={{
                  "& .MuiFormLabel-asterisk": {
                    color: "#B20000", // สีแดงของ theme
                  },
                }}
              />
            </Grid>

            {/* ช่องทางการติดต่อ - สำคัญสำหรับ sales */}
            <Grid size={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel required sx={{ color: "#B20000" }}>ช่องทางติดต่อ</InputLabel>
                <StyledSelect
                  label="ช่องทางติดต่อ *"
                  name="cus_channel"
                  value={inputList.cus_channel || ""}
                  onChange={handleInputChange}
                  readOnly={mode === "view"}
                  error={!!errors.cus_channel}
                >
                  {selectList.map((item, index) => (
                    <MenuItem
                      key={item.value + index}
                      value={item.value}
                      sx={{ textTransform: "uppercase" }}
                    >
                      {item.title}
                    </MenuItem>
                  ))}
                </StyledSelect>
                <FormHelperText error>
                  {errors.cus_channel && "กรุณาเลือกช่องทาง"}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* วันที่สร้าง - แสดงให้เห็น */}
            <Grid size={12} md={3}>
              <StyledTextField
                fullWidth
                disabled
                size="small"
                label="วันที่สร้าง"
                value={
                  inputList.cus_created_date
                    ? new Date(inputList.cus_created_date).toLocaleDateString("th-TH")
                    : new Date().toLocaleDateString("th-TH")
                }
                InputProps={{
                  style: { textAlign: "center" },
                }}
              />
            </Grid>
          </Grid>

          {/* Row 2: ประเภทธุรกิจและผู้ดูแล */}
          <Grid container spacing={1.5}>
            {/* ประเภทธุรกิจ + ปุ่มจัดการ */}
            <Grid size={12} md={isAdmin ? 6 : 8}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel required sx={{ color: "#B20000" }}>ประเภทธุรกิจ</InputLabel>
                  <StyledSelect
                    label="ประเภทธุรกิจ *"
                    name="cus_bt_id"
                    value={inputList.cus_bt_id || ""}
                    onChange={handleInputChange}
                    readOnly={mode === "view" || businessTypesIsFetching}
                    error={!!errors.cus_bt_id}
                    startAdornment={
                      <InputAdornment position="start">
                        <MdBusiness sx={{ color: "#B20000" }} />
                      </InputAdornment>
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250, // ลดความสูงลง
                        },
                      },
                    }}
                  >
                    <MenuItem disabled value="">
                      เลือกประเภทธุรกิจ
                    </MenuItem>
                    <MenuItem>
                      <input
                        autoFocus
                        placeholder="ค้นหาประเภทธุรกิจ..."
                        style={{
                          width: "100%",
                          padding: "6px 8px", // ลด padding
                          boxSizing: "border-box",
                          border: "1px solid #EBEBEB",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const searchValue = e.target.value.toLowerCase();
                          const filteredList =
                            businessTypesData?.filter((item) =>
                              item.bt_name.toLowerCase().includes(searchValue)
                            ) || [];
                          setBusinessTypesList(filteredList);
                        }}
                      />
                    </MenuItem>
                    {businessTypesList.map((item) => (
                      <MenuItem key={item.bt_id} value={item.bt_id}>
                        {item.bt_name}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                  <FormHelperText error>
                    {errors.cus_bt_id && "กรุณาเลือกประเภทธุรกิจ"}
                  </FormHelperText>
                </FormControl>
                <Tooltip title="จัดการประเภทธุรกิจ">
                  <IconButton
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: "#B20000", // สีแดงหลักของ theme
                      color: "white",
                      border: "1px solid #B20000",
                      "&:hover": {
                        bgcolor: "#900F0F", // สีแดงเข้มของ theme
                      }
                    }}
                    disabled={mode === "view"}
                    onClick={handleOpenBusinessTypeManager}
                  >
                    <MdSettings />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            {/* ผู้ดูแล - แสดงเฉพาะ admin */}
            {isAdmin && (
              <Grid size={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: "#B20000" }}>ผู้ดูแลลูกค้า</InputLabel>
                  <StyledSelect
                    label="ผู้ดูแลลูกค้า"
                    name="cus_manage_by"
                    value={inputList.cus_manage_by?.user_id || ""}
                    onChange={handleInputChange}
                    readOnly={mode === "view"}
                    startAdornment={
                      <InputAdornment position="start">
                        <MdPerson sx={{ color: "#B20000" }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">ไม่มีผู้ดูแล</MenuItem>
                    {salesList &&
                      salesList.map((item, index) => (
                        <MenuItem
                          key={item.user_id + index}
                          value={item.user_id}
                          sx={{ textTransform: "capitalize" }}
                        >
                          {item.username}
                        </MenuItem>
                      ))}
                  </StyledSelect>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {/* Tips สำหรับ Sales */}
          {mode === "create" && (
            <Box 
              sx={{ 
                mt: 1.5, 
                p: 1, 
                backgroundColor: "rgba(178, 0, 0, 0.05)", 
                borderRadius: 1,
                borderLeft: "3px solid #B20000"
              }}
            >
              <Typography variant="caption" sx={{ color: "#B20000", fontWeight: 500 }}>
                💡 เคล็ดลับ: กรอกชื่อบริษัท → เลือกช่องทางติดต่อ → เลือกประเภทธุรกิจ แล้วไปกรอกข้อมูลในแท็บถัดไป
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default DialogHeader; 