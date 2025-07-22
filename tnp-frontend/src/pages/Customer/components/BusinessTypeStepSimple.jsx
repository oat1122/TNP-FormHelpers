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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  useMediaQuery,
  useTheme,
  Chip,
  Stack,
  Autocomplete,
} from "@mui/material";
import { MdBusiness, MdSettings, MdExpandMore } from "react-icons/md";
import { HiOfficeBuilding, HiUser, HiPhone, HiIdentification } from "react-icons/hi";

// สี theme ของบริษัท
const PRIMARY_RED = "#9e0000"; // Updated to match the consistent theme
const SECONDARY_RED = "#d32f2f";
const BACKGROUND_COLOR = "#fffaf9";
const DIVIDER_COLOR = "#9e000022";

/**
 * BusinessTypeStepSimple - Mobile-first design for customer business type selection
 * Enhanced with accordion layout and better mobile UX
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  return (
    <Box>
      {/* Header */}
      <Box 
        sx={{ 
          px: 2, 
          py: 3,
          background: `linear-gradient(135deg, ${PRIMARY_RED} 0%, ${SECONDARY_RED} 100%)`,
          color: "white",
          borderRadius: { xs: 0, sm: "0 0 16px 16px" },
          mb: { xs: 0, sm: 2 }
        }}
      >
        <Container maxWidth="md">
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <MdBusiness size={32} />
            <Box>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight={700}
                fontFamily="Kanit"
              >
                ประเภทธุรกิจ
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ opacity: 0.9 }}
                fontFamily="Kanit"
              >
                {mode === "view" ? "ดูข้อมูลประเภทธุรกิจ" : "เลือกประเภทธุรกิจและกรอกข้อมูลพื้นฐาน"}
              </Typography>
            </Box>
          </Box>
          
          {/* Progress indicator for mobile */}
          {isMobile && mode !== "view" && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ขั้นตอนที่ 1 จาก 3
              </Typography>
              <Box sx={{ 
                height: 4, 
                bgcolor: "rgba(255,255,255,0.3)", 
                borderRadius: 2,
                mt: 0.5,
                overflow: "hidden"
              }}>
                <Box sx={{ 
                  width: "33.33%", 
                  height: "100%", 
                  bgcolor: "white",
                  borderRadius: 2
                }} />
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: { xs: 10, sm: 4 }, pt: { xs: 2, sm: 0 } }}>
        {/* SECTION 1: ประเภทธุรกิจและข้อมูลบริษัท */}
        <Accordion 
          defaultExpanded 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            "&:before": { display: "none" },
            boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)"
          }}
        >
          <AccordionSummary 
            expandIcon={<MdExpandMore size={24} />}
            sx={{
              bgcolor: "white",
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                gap: 2
              }
            }}
          >
            <HiOfficeBuilding size={24} color={PRIMARY_RED} />
            <Box>
              <Typography fontWeight={600} fontFamily="Kanit" color={PRIMARY_RED}>
                ข้อมูลบริษัท
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="Kanit">
                ประเภทธุรกิจและชื่อบริษัท
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
            <Stack spacing={3}>
              {/* ประเภทธุรกิจ */}
              <Box>
                <Box sx={{ 
                  display: "flex", 
                  gap: 1, 
                  alignItems: "flex-start",
                  flexDirection: { xs: "column", sm: "row" }
                }}>
                  <Autocomplete
                    fullWidth
                    loading={businessTypesIsFetching}
                    disabled={mode === "view"}
                    options={businessTypesList}
                    getOptionLabel={(option) => option.bt_name || ""}
                    value={businessTypesList.find((type) => type.bt_id === inputList.cus_bt_id) || null}
                    onChange={(event, newValue) => {
                      const syntheticEvent = {
                        target: {
                          name: "cus_bt_id",
                          value: newValue ? newValue.bt_id : ""
                        }
                      };
                      handleInputChange(syntheticEvent);
                    }}
                    isOptionEqualToValue={(option, value) => option.bt_id === value.bt_id}
                    renderOption={(props, option) => (
                      <Box
                        component="li"
                        {...props}
                        sx={{
                          fontFamily: "Kanit",
                          fontSize: { xs: "0.85rem", sm: "0.875rem" },
                          padding: { xs: "12px 16px", sm: "12px 16px" },
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                          lineHeight: 1.4,
                          minHeight: "auto",
                          "&:hover": {
                            bgcolor: `${PRIMARY_RED}08`
                          }
                        }}
                      >
                        {option.bt_name}
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="เลือกประเภทธุรกิจ *"
                        placeholder="ค้นหาและเลือกประเภทธุรกิจ..."
                        error={!!errors.cus_bt_id}
                        helperText={errors.cus_bt_id}
                        size="small"
                        sx={{ 
                          bgcolor: "white",
                          "& .MuiInputBase-input": {
                            fontFamily: "Kanit", 
                            fontSize: 14
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Kanit", 
                            fontSize: 14
                          }
                        }}
                      />
                    )}
                    ListboxProps={{
                      sx: {
                        maxHeight: { xs: 280, sm: 400 },
                        "& .MuiAutocomplete-option": {
                          fontFamily: "Kanit"
                        }
                      }
                    }}
                    PaperComponent={({ children, ...other }) => (
                      <Paper
                        {...other}
                        sx={{
                          width: { xs: "calc(100vw - 32px)", sm: "auto" },
                          maxWidth: { xs: "calc(100vw - 32px)", sm: 500 },
                        }}
                      >
                        {children}
                      </Paper>
                    )}
                  />

                  {mode !== "view" && !isMobile && (
                    <Tooltip title="จัดการประเภทธุรกิจ" arrow>
                      <IconButton
                        onClick={handleOpenBusinessTypeManager}
                        sx={{
                          color: PRIMARY_RED,
                          border: `1px solid ${PRIMARY_RED}`,
                          width: 40,
                          height: 40,
                          bgcolor: "white",
                          "&:hover": {
                            backgroundColor: `${PRIMARY_RED}10`,
                          },
                        }}
                      >
                        <MdSettings />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                {/* Mobile settings button */}
                {mode !== "view" && isMobile && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      icon={<MdSettings />}
                      label="จัดการประเภทธุรกิจ"
                      onClick={handleOpenBusinessTypeManager}
                      variant="outlined"
                      sx={{
                        color: PRIMARY_RED,
                        borderColor: PRIMARY_RED,
                        fontFamily: "Kanit",
                        "&:hover": {
                          bgcolor: `${PRIMARY_RED}08`
                        }
                      }}
                    />
                  </Box>
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
                sx={{ bgcolor: "white" }}
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
                sx={{ bgcolor: "white" }}
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
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* SECTION 2: ข้อมูลติดต่อ */}
        <Accordion 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            "&:before": { display: "none" },
            boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)"
          }}
        >
          <AccordionSummary 
            expandIcon={<MdExpandMore size={24} />}
            sx={{
              bgcolor: "white",
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                gap: 2
              }
            }}
          >
            <HiPhone size={24} color={PRIMARY_RED} />
            <Box>
              <Typography fontWeight={600} fontFamily="Kanit" color={PRIMARY_RED}>
                ช่องทางการติดต่อ
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="Kanit">
                วิธีการติดต่อกับลูกค้า
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
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
                  bgcolor: "white"
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
          </AccordionDetails>
        </Accordion>

        {/* SECTION 3: ข้อมูลผู้ติดต่อ */}
        <Accordion 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            "&:before": { display: "none" },
            boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)"
          }}
        >
          <AccordionSummary 
            expandIcon={<MdExpandMore size={24} />}
            sx={{
              bgcolor: "white",
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                gap: 2
              }
            }}
          >
            <HiUser size={24} color={PRIMARY_RED} />
            <Box>
              <Typography fontWeight={600} fontFamily="Kanit" color={PRIMARY_RED}>
                ข้อมูลผู้ติดต่อ
              </Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="Kanit">
                ชื่อจริงและชื่อเล่นของลูกค้า
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
            <Stack spacing={3}>
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
                    sx={{ bgcolor: "white" }}
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
                    sx={{ bgcolor: "white" }}
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
                sx={{ bgcolor: "white" }}
                inputProps={{ maxLength: 50 }}
                InputProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
                InputLabelProps={{
                  style: { fontFamily: "Kanit", fontSize: 14 },
                }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Container>
    </Box>
  );
};

export default BusinessTypeStepSimple;
