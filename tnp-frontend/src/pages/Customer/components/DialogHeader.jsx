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
      {/* Dialog Title */}
      <DialogTitle
        sx={{
          paddingBlock: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6">
            {titleMap[mode] + `ข้อมูลลูกค้า`}
          </Typography>
          {mode !== "create" && (
            <Chip
              size="small"
              color="info"
              label={`${formattedRelativeTime} Days`}
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <IconButton
          aria-label="close"
          onClick={handleCloseDialog}
          sx={(theme) => ({
            color: theme.vars.palette.grey.title,
          })}
        >
          <MdClose />
        </IconButton>
      </DialogTitle>

      {/* Note Card - Display important notes */}
      {inputList.cd_note && (
        <Card
          variant="outlined"
          sx={{
            mb: 2,
            mx: 3,
            borderLeft: "4px solid",
            borderColor: "#940c0c",
            bgcolor: "warning.lighter",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="text.primary"
              >
                หมายเหตุสำคัญ
              </Typography>
            </Box>
            <Typography variant="body1">{inputList.cd_note}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Customer Info Summary Card */}
      <Card variant="outlined" sx={{ mb: 2, mx: 3 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Grid container spacing={2}>
            <Grid size={12} md={8}>
              <StyledTextField
                fullWidth
                required
                label="ชื่อบริษัท"
                size="small"
                InputProps={{
                  readOnly: mode === "view",
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdBusiness />
                    </InputAdornment>
                  ),
                }}
                name="cus_company"
                placeholder="บริษัท ธนพลัส 153 จำกัด"
                value={inputList.cus_company || ""}
                onChange={handleInputChange}
                error={!!errors.cus_company}
                helperText={errors.cus_company}
              />
            </Grid>

            {isAdmin && (
              <Grid size={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>ชื่อผู้ดูแล</InputLabel>
                  <StyledSelect
                    label="ชื่อผู้ดูแล"
                    name="cus_manage_by"
                    value={inputList.cus_manage_by?.user_id || ""}
                    onChange={handleInputChange}
                    readOnly={mode === "view"}
                    startAdornment={
                      <InputAdornment position="start">
                        <MdPerson />
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

            <Grid size={12} md={isAdmin ? 6 : 8}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel required>ประเภทธุรกิจ</InputLabel>
                  <StyledSelect
                    label="ประเภทธุรกิจ *"
                    name="cus_bt_id"
                    value={inputList.cus_bt_id || ""}
                    onChange={handleInputChange}
                    readOnly={mode === "view" || businessTypesIsFetching}
                    error={!!errors.cus_bt_id}
                    startAdornment={
                      <InputAdornment position="start">
                        <MdBusiness />
                      </InputAdornment>
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    <MenuItem disabled value="">
                      ประเภทธุรกิจ
                    </MenuItem>
                    <MenuItem>
                      <input
                        autoFocus
                        placeholder="ค้นหาประเภทธุรกิจ..."
                        style={{
                          width: "100%",
                          padding: "8px",
                          boxSizing: "border-box",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
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
                    color="primary"
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: (theme) => theme.vars.palette.grey.outlinedInput,
                      border: "1px solid",
                      borderColor: (theme) => theme.vars.palette.grey.outlinedInput,
                    }}
                    disabled={mode === "view"}
                    onClick={handleOpenBusinessTypeManager}
                  >
                    <MdSettings />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            <Grid size={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel required>ช่องทางการติดต่อ</InputLabel>
                <StyledSelect
                  label="ช่องทางการติดต่อ *"
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
                  {errors.cus_channel && "กรุณาเลือกช่องทางการติดต่อ"}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={12} md={2}>
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
        </CardContent>
      </Card>
    </>
  );
};

export default DialogHeader; 