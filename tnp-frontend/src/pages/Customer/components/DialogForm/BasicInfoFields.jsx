import React from "react";
import { Grid, Box, Typography, InputAdornment, Divider, Paper } from "@mui/material";
import { StyledTextField } from "./StyledComponents";
import { MdPerson, MdWork, MdBusinessCenter } from "react-icons/md";

function BasicInfoFields({ inputList, handleInputChange, errors, mode }) {
  return (
    <Box>
      {/* ส่วนข้อมูลส่วนตัว */}
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
          <MdPerson style={{ marginRight: 8 }} /> ข้อมูลส่วนตัว
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <StyledTextField
              fullWidth
              required
              label="ชื่อจริง"
              size="small"
              name="cus_firstname"
              placeholder="ชื่อจริง"
              value={inputList.cus_firstname || ""}
              onChange={handleInputChange}
              error={!!errors.cus_firstname}
              helperText={errors.cus_firstname}
              InputProps={{ 
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPerson />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledTextField
              fullWidth
              required
              label="นามสกุล"
              size="small"
              name="cus_lastname"
              placeholder="นามสกุล"
              value={inputList.cus_lastname || ""}
              onChange={handleInputChange}
              error={!!errors.cus_lastname}
              helperText={errors.cus_lastname}
              InputProps={{ 
                readOnly: mode === "view" 
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledTextField
              fullWidth
              required
              label="ชื่อเล่น"
              size="small"
              name="cus_name"
              placeholder="ชื่อเล่น"
              value={inputList.cus_name || ""}
              onChange={handleInputChange}
              error={!!errors.cus_name}
              helperText={errors.cus_name}
              InputProps={{ 
                readOnly: mode === "view" 
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ส่วนข้อมูลการทำงาน */}
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
          <MdBusinessCenter style={{ marginRight: 8 }} /> ข้อมูลการทำงาน
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="ตำแหน่ง"
              size="small"
              name="cus_depart"
              placeholder="ตำแหน่ง"
              value={inputList.cus_depart || ""}
              onChange={handleInputChange}
              InputProps={{ 
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdWork />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default BasicInfoFields;
