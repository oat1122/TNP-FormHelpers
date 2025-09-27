import React from "react";
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Category } from "@mui/icons-material";

const ShirtTypeSelector = ({ formData, errors, shirtTypes, onInputChange }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Category sx={{ mr: 1, verticalAlign: "middle" }} />
          ประเภทเสื้อ
        </Typography>

        <FormControl fullWidth error={!!errors.shirt_type}>
          <InputLabel>ประเภทเสื้อ</InputLabel>
          <Select
            value={formData.shirt_type}
            onChange={(e) => onInputChange("shirt_type", e.target.value)}
            label="ประเภทเสื้อ"
          >
            {shirtTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
          {errors.shirt_type && (
            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
              {errors.shirt_type}
            </Typography>
          )}
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default ShirtTypeSelector;
