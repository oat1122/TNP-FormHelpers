import { Person } from "@mui/icons-material";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import React from "react";

const BasicInfoForm = ({
  formData,
  errors,
  priorityLevels,
  onInputChange,
  language = "th",
  t = (key) => key,
}) => {
  return (
    <Card sx={{ borderRadius: { xs: 2, md: 1 } }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          variant="h6"
          gutterBottom
          className={language === "my" ? "myanmar-text" : ""}
          sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}
        >
          <Person sx={{ mr: 1, verticalAlign: "middle" }} />
          {t("stepBasicInfo")}
        </Typography>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label={t("title_field")}
              value={formData.title}
              onChange={(e) => onInputChange("title", e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
              required
              className={`mobile-form-field ${language === "my" ? "myanmar-text" : ""}`}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: { xs: "1rem", md: "0.875rem" },
                  padding: { xs: "14px", md: "14px" },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label={t("customer")}
              value={formData.customer_name}
              onChange={(e) => onInputChange("customer_name", e.target.value)}
              error={!!errors.customer_name}
              helperText={errors.customer_name}
              fullWidth
              required
              className={`mobile-form-field ${language === "my" ? "myanmar-text" : ""}`}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: { xs: "1rem", md: "0.875rem" },
                  padding: { xs: "14px", md: "14px" },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth className="mobile-form-field">
              <InputLabel className={language === "my" ? "myanmar-text" : ""}>
                {t("priority")}
              </InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => onInputChange("priority", e.target.value)}
                label={t("priority")}
                className={language === "my" ? "myanmar-text" : ""}
                sx={{
                  "& .MuiSelect-select": {
                    fontSize: { xs: "1rem", md: "0.875rem" },
                    padding: { xs: "14px", md: "14px" },
                  },
                }}
              >
                {priorityLevels.map((level) => (
                  <MenuItem
                    key={level.value}
                    value={level.value}
                    className={language === "my" ? "myanmar-text" : ""}
                  >
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: level.color,
                          borderRadius: "50%",
                          mr: 1,
                        }}
                      />
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
