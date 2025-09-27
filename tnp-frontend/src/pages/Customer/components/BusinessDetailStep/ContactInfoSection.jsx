import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Grid2 as Grid,
  Box,
} from "@mui/material";
import React from "react";
import { MdExpandMore, MdPhone } from "react-icons/md";

const ContactInfoSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  PRIMARY_RED,
  BACKGROUND_COLOR,
}) => {
  return (
    <Accordion
      defaultExpanded
      sx={{
        mb: 2,
        borderRadius: 2,
        "&:before": { display: "none" },
        boxShadow: "0 2px 8px rgba(158, 0, 0, 0.1)",
      }}
    >
      <AccordionSummary
        expandIcon={<MdExpandMore size={24} />}
        sx={{
          bgcolor: "white",
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 2,
          },
        }}
      >
        <MdPhone size={24} color={PRIMARY_RED} />
        <Box>
          <Typography fontWeight={600} fontFamily="Kanit" color={PRIMARY_RED}>
            ข้อมูลติดต่อ
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="Kanit">
            เบอร์โทรศัพท์และอีเมล (บังคับกรอก)
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: BACKGROUND_COLOR }}>
        <Grid container spacing={2}>
          <Grid xs={12} sm={6}>
            <TextField
              name="cus_tel_1"
              label="เบอร์โทรหลัก"
              value={inputList.cus_tel_1 || ""}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!errors.cus_tel_1}
              helperText={errors.cus_tel_1}
              disabled={mode === "view"}
              placeholder="เช่น 02-123-4567"
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
              name="cus_tel_2"
              label="เบอร์โทรสำรอง"
              value={inputList.cus_tel_2 || ""}
              onChange={handleInputChange}
              fullWidth
              error={!!errors.cus_tel_2}
              helperText={errors.cus_tel_2}
              disabled={mode === "view"}
              placeholder="เช่น 08-1234-5678"
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
          <Grid xs={12}>
            <TextField
              name="cus_email"
              label="อีเมล"
              value={inputList.cus_email || ""}
              onChange={handleInputChange}
              fullWidth
              type="email"
              error={!!errors.cus_email}
              helperText={errors.cus_email}
              disabled={mode === "view"}
              placeholder="เช่น contact@company.com"
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
      </AccordionDetails>
    </Accordion>
  );
};

export default ContactInfoSection;
