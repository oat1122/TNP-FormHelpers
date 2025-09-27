import { Straighten, Lock } from "@mui/icons-material";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Autocomplete,
  Alert,
  Chip,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Box,
} from "@mui/material";
import React from "react";

const SizeBreakdownTable = ({
  formData,
  errors,
  sizeOptions,
  selectedWorksheet,
  isAutoFilled,
  onSizeBreakdown,
  onSizeQuantityChange,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Straighten sx={{ mr: 1, verticalAlign: "middle" }} />
          ขนาดและจำนวน
          {isAutoFilled && <Lock sx={{ ml: 1, verticalAlign: "middle", color: "warning.main" }} />}
        </Typography>

        {/* Auto-fill warning */}
        {isAutoFilled && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>ข้อมูลนี้ถูกกำหนดจาก NewWorksNet:</strong>
              <br />
            </Typography>
          </Alert>
        )}

        <Autocomplete
          multiple
          value={formData.sizes}
          onChange={(event, newValue) => !isAutoFilled && onSizeBreakdown(newValue)}
          options={sizeOptions}
          disabled={isAutoFilled}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
                onDelete={isAutoFilled ? undefined : getTagProps({ index }).onDelete}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="เลือกไซส์ "
              placeholder={
                isAutoFilled
                  ? "ไซส์ถูกกำหนดจาก NewWorksNet (ไม่สามารถแก้ไขได้)"
                  : "เลือกไซส์ที่ต้องการ"
              }
              error={!!errors.sizes}
              helperText={
                errors.sizes ||
                (isAutoFilled
                  ? "ไซส์ถูกดึงมาจาก NewWorksSheet และไม่สามารถแก้ไขได้"
                  : "ไซส์จะถูกดึงมาจาก pattern_sizes (men/women) ใน NewWorksSheet")
              }
            />
          )}
        />

        {/* Show pattern sizes info if available */}
        {formData.size_breakdown.some((item) => item.gender) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>ข้อมูลไซส์จาก NewWorksNet pattern_sizes:</strong>
              <br />
              {formData.size_breakdown.filter((item) => item.gender === "men").length > 0 && (
                <>
                  ชาย:{" "}
                  {formData.size_breakdown
                    .filter((item) => item.gender === "men")
                    .map((item) => `${item.size}(${item.quantity})`)
                    .join(", ")}
                  <br />
                </>
              )}
              {formData.size_breakdown.filter((item) => item.gender === "women").length > 0 && (
                <>
                  หญิง:{" "}
                  {formData.size_breakdown
                    .filter((item) => item.gender === "women")
                    .map((item) => `${item.size}(${item.quantity})`)
                    .join(", ")}
                </>
              )}
            </Typography>
          </Alert>
        )}

        {/* Size Breakdown Table */}
        {formData.size_breakdown.length > 0 && (
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableBody>
                {formData.size_breakdown.map((item, index) => (
                  <TableRow key={`${item.size}-${item.gender || "unisex"}-${index}`}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={item.size}
                          variant="outlined"
                          color={
                            item.gender === "men"
                              ? "primary"
                              : item.gender === "women"
                                ? "secondary"
                                : "default"
                          }
                          size="small"
                        />
                        {item.gender && (
                          <Typography variant="caption" color="text.secondary">
                            {item.gender === "men" ? "ชาย" : item.gender === "women" ? "หญิง" : ""}
                          </Typography>
                        )}
                        {item.details?.chest && (
                          <Typography variant="caption" color="text.secondary">
                            (อก: {item.details.chest}")
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          !isAutoFilled &&
                          onSizeQuantityChange(index, parseInt(e.target.value) || 0)
                        }
                        inputProps={{ min: 0, readOnly: isAutoFilled }}
                        size="small"
                        sx={{ width: 80 }}
                        disabled={isAutoFilled}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <strong>รวม</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{formData.total_quantity} ตัว</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SizeBreakdownTable;
