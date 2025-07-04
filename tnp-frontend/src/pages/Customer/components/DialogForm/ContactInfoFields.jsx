import React from "react";
import { Grid, InputAdornment, Box, Typography, Paper } from "@mui/material";
import { MdPhone, MdEmail, MdContactPhone, MdReceipt } from "react-icons/md";
import { StyledTextField } from "./StyledComponents";

function ContactInfoFields({ inputList, handleInputChange, errors, mode }) {
  return (
    <Box>
      {/* ส่วนข้อมูลการติดต่อ */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 2, 
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          <MdContactPhone style={{ marginRight: 8 }} /> ข้อมูลการติดต่อ
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              required
              label="เบอร์โทรศัพท์"
              size="small"
              name="cus_tel_1"
              placeholder="เบอร์"
              value={inputList.cus_tel_1 || ""}
              onChange={handleInputChange}
              error={!!errors.cus_tel_1}
              helperText={errors.cus_tel_1}
              InputProps={{
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone style={{ color: '#4caf50' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="เบอร์สำรอง"
              size="small"
              name="cus_tel_2"
              placeholder="เบอร์สำรอง"
              value={inputList.cus_tel_2 || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone style={{ color: '#ff9800' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="อีเมล"
              size="small"
              name="cus_email"
              placeholder="อีเมล"
              type="email"
              value={inputList.cus_email || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdEmail style={{ color: '#2196f3' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ส่วนข้อมูลทางภาษี */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 2, 
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          <MdReceipt style={{ marginRight: 8 }} /> ข้อมูลทางภาษี
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <StyledTextField
              fullWidth
              label="เลขผู้เสียภาษี"
              size="small"
              name="cus_tax_id"
              placeholder="เลขผู้เสียภาษี (13 หลัก)"
              value={inputList.cus_tax_id || ""}
              onChange={handleInputChange}
              InputProps={{ 
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdReceipt />
                  </InputAdornment>
                ),
              }}
              helperText={inputList.cus_tax_id && inputList.cus_tax_id.length !== 13 ? "เลขผู้เสียภาษีควรมี 13 หลัก" : ""}
              error={inputList.cus_tax_id && inputList.cus_tax_id.length !== 13}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default ContactInfoFields;
