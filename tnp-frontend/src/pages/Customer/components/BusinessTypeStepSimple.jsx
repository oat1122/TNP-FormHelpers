import React from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Paper,
  IconButton,
  Tooltip,
  Grid2 as Grid,
} from "@mui/material";
import { MdBusiness, MdSettings } from "react-icons/md";

// สี theme ของบริษัท
const PRIMARY_RED = "#B20000";

/**
 * BusinessTypeStep - ขั้นตอนที่ 1: เลือกประเภทธุรกิจและข้อมูลพื้นฐาน (Simple Version)
 */
const BusinessTypeStepSimple = ({
  inputList = {},
  errors = {},
  handleInputChange,
  businessTypesList = [],
  handleOpenBusinessTypeManager,
  businessTypesIsFetching = false,
  mode = "create",
}) => {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 2, px: { xs: 1, sm: 0 } }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          border: `2px solid ${PRIMARY_RED}`,
          borderRadius: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <MdBusiness size={28} color={PRIMARY_RED} />
          <Typography
            variant="h5"
            fontWeight={600}
            color={PRIMARY_RED}
            fontFamily="Kanit"
          >
            ประเภทธุรกิจ
          </Typography>
        </Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          fontFamily="Kanit"
        >
          เลือกประเภทธุรกิจและกรอกข้อมูลพื้นฐานของบริษัท
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ประเภทธุรกิจ */}
        <Box sx={{ 
          display: "flex", 
          gap: 1, 
          alignItems: "flex-start",
          flexDirection: { xs: "column", sm: "row" }
        }}>
          <FormControl
            fullWidth
            error={!!errors.cus_bt_id}
            disabled={mode === "view"}
            size="small"
          >
            <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
              เลือกประเภทธุรกิจ *
            </InputLabel>
            <Select
              name="cus_bt_id"
              value={inputList.cus_bt_id || ""}
              onChange={handleInputChange}
              label="เลือกประเภทธุรกิจ *"
              disabled={businessTypesIsFetching || mode === "view"}
              sx={{ 
                fontFamily: "Kanit", 
                fontSize: 14
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: { xs: 250, sm: 400 },
                    width: { xs: "calc(100vw - 32px)", sm: "auto" },
                    maxWidth: { xs: "calc(100vw - 32px)", sm: 500 },
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                    "& .MuiMenuItem-root": {
                      fontFamily: "Kanit",
                      fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      padding: { xs: "8px 12px", sm: "12px 16px" },
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      lineHeight: 1.3,
                      minHeight: { xs: "auto", sm: "48px" }
                    },
                    "& .MuiList-root": {
                      padding: 0
                    }
                  }
                },
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left",
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left",
                }
              }}
            >
              <MenuItem value="" disabled>
                <em>กรุณาเลือกประเภทธุรกิจ</em>
              </MenuItem>
              {businessTypesList.map((type) => (
                <MenuItem key={type.bt_id} value={type.bt_id}>
                  <Typography 
                    fontFamily="Kanit" 
                    fontSize={{ xs: "0.8rem", sm: "0.875rem" }}
                    sx={{ 
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical"
                    }}
                  >
                    {type.bt_name}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {mode !== "view" && (
            <Tooltip title="จัดการประเภทธุรกิจ" arrow>
              <IconButton
                onClick={handleOpenBusinessTypeManager}
                sx={{
                  color: PRIMARY_RED,
                  border: `1px solid ${PRIMARY_RED}`,
                  width: { xs: "100%", sm: "auto" },
                  height: 40,
                  mt: { xs: 1, sm: 0 },
                  display: { xs: "none", sm: "flex" }, // ซ่อนในโหมดมือถือ
                  "&:hover": {
                    backgroundColor: `${PRIMARY_RED}10`,
                  },
                }}
              >
                <MdSettings />
                <Typography sx={{ 
                  ml: 1, 
                  fontFamily: "Kanit", 
                  fontSize: "0.8rem",
                  display: { xs: "inline", sm: "none" }
                }}>
                  จัดการประเภทธุรกิจ
                </Typography>
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* ชื่อบริษัท */}
        <TextField
          name="cus_company"
          label="ชื่อบริษัท"
          value={inputList.cus_company || ""}
          onChange={handleInputChange}
          fullWidth
          required
          error={!!errors.cus_company}
          helperText={errors.cus_company}
          disabled={mode === "view"}
          placeholder="เช่น บริษัท ABC จำกัด"
          size="small"
          InputProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
          InputLabelProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
        />

        {/* เลขประจำตัวผู้เสียภาษี */}
        <TextField
          name="cus_tax_id"
          label="เลขประจำตัวผู้เสียภาษี"
          value={inputList.cus_tax_id || ""}
          onChange={handleInputChange}
          fullWidth
          error={!!errors.cus_tax_id}
          helperText={errors.cus_tax_id || "เลข 13 หลัก (ไม่บังคับ)"}
          disabled={mode === "view"}
          placeholder="เช่น 1234567890123"
          size="small"
          inputProps={{
            maxLength: 13,
            pattern: "[0-9]*",
          }}
          InputProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
          InputLabelProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
        />

        {/* ช่องทางการติดต่อ */}
        <FormControl fullWidth disabled={mode === "view"} size="small">
          <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>
            ช่องทางการติดต่อ *
          </InputLabel>
          <Select
            name="cus_channel"
            value={inputList.cus_channel || 1}
            onChange={handleInputChange}
            label="ช่องทางการติดต่อ *"
            required
            error={!!errors.cus_channel}
            sx={{
              fontFamily: "Kanit",
              fontSize: 14,
            }}
          >
            <MenuItem value={1} sx={{ fontFamily: "Kanit" }}>
              Sales
            </MenuItem>
            <MenuItem value={2} sx={{ fontFamily: "Kanit" }}>
              Online
            </MenuItem>
            <MenuItem value={3} sx={{ fontFamily: "Kanit" }}>
              Office
            </MenuItem>
          </Select>
          {errors.cus_channel && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 0.5, fontFamily: "Kanit" }}
            >
              {errors.cus_channel}
            </Typography>
          )}
        </FormControl>

        {/* ชื่อ-นามสกุล */}
        <Grid container spacing={2}>
          <Grid xs={12} sm={6}>
            <TextField
              name="cus_firstname"
              label="ชื่อจริงลูกค้า"
              value={inputList.cus_firstname || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_firstname}
              helperText={errors.cus_firstname}
              disabled={mode === "view"}
              placeholder="เช่น สมชาย"
              size="small"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <TextField
              name="cus_lastname"
              label="นามสกุลลูกค้า"
              value={inputList.cus_lastname || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_lastname}
              helperText={errors.cus_lastname}
              disabled={mode === "view"}
              placeholder="เช่น ใจดี"
              size="small"
              InputProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
              InputLabelProps={{
                style: { fontFamily: "Kanit", fontSize: 14 },
              }}
            />
          </Grid>
        </Grid>

        {/* ชื่อเล่น */}
        <TextField
          name="cus_name"
          label="ชื่อเล่น"
          value={inputList.cus_name || ""}
          onChange={handleInputChange}
          fullWidth
          required
          error={!!errors.cus_name}
          helperText={errors.cus_name}
          disabled={mode === "view"}
          placeholder="เช่น ABC, บริษัท ABC"
          size="small"
          inputProps={{ maxLength: 50 }}
          InputProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
          InputLabelProps={{
            style: { fontFamily: "Kanit", fontSize: 14 },
          }}
        />
      </Box>
    </Box>
  );
};

export default BusinessTypeStepSimple;
