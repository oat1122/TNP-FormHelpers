import {
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { MdEdit } from "react-icons/md";
import { PRIMARY_RED } from "../../utils";

/**
 * BasicInfoCard - Card section for product basic information
 * Covers: name, SKU, unit, description, category, origin country, seller, contact
 */
const BasicInfoCard = ({
  form,
  handleChange,
  handleCategoryChange,
  categories,
  isView,
  onOpenCategory,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}>
          ข้อมูลพื้นฐาน
        </Typography>
        <Grid container spacing={2}>
          {/* Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="ชื่อสินค้า *"
              value={form.sp_name}
              onChange={handleChange("sp_name")}
              disabled={isView}
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
          </Grid>
          {/* SKU */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="SKU"
              value={form.sp_sku}
              onChange={handleChange("sp_sku")}
              disabled={isView}
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
          </Grid>
          {/* Unit */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="หน่วยนับ"
              value={form.sp_unit}
              onChange={handleChange("sp_unit")}
              disabled={isView}
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
          </Grid>
          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="รายละเอียดสินค้า"
              value={form.sp_description}
              onChange={handleChange("sp_description")}
              disabled={isView}
              multiline
              rows={3}
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
          </Grid>
          {/* Category */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily: "Kanit" }}>หมวดหมู่</InputLabel>
                <Select
                  value={form.sp_mpc_id}
                  label="หมวดหมู่"
                  onChange={handleCategoryChange}
                  disabled={isView}
                  sx={{ fontFamily: "Kanit" }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
                    -- ไม่ระบุ --
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.mpc_id} value={cat.mpc_id} sx={{ fontFamily: "Kanit" }}>
                      {cat.mpc_name}
                      {cat.mpc_sku_prefix && ` [${cat.mpc_sku_prefix}]`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!isView && (
                <Tooltip title="จัดการหมวดหมู่">
                  <IconButton
                    size="small"
                    onClick={onOpenCategory}
                    sx={{ mt: 0.5, color: PRIMARY_RED }}
                  >
                    <MdEdit />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoCard;
