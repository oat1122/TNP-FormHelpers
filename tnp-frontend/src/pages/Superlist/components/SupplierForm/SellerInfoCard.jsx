import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Autocomplete,
  Tooltip,
  IconButton,
} from "@mui/material";
import { MdEdit } from "react-icons/md";
import { PRIMARY_RED } from "../../utils";

/**
 * SellerInfoCard - Card section for seller information
 * Covers: seller selection and read-only seller details
 */
const SellerInfoCard = ({ sellers, selectedSeller, handleSellerChange, isView, onOpenSeller }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}>
          ข้อมูลผู้ขาย (Seller)
        </Typography>

        {/* Seller Selection */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 2 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={sellers}
            value={selectedSeller}
            getOptionLabel={(option) => option.ss_company_name || ""}
            isOptionEqualToValue={(option, value) => option.ss_id === value?.ss_id}
            onChange={(e, newValue) => handleSellerChange(newValue)}
            disabled={isView}
            renderOption={(props, option) => (
              <li {...props} key={option.ss_id}>
                <Box>
                  <Typography sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                    {option.ss_company_name}
                  </Typography>
                  {option.ss_country && (
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "Kanit", color: "text.secondary" }}
                    >
                      {option.ss_country}
                      {option.ss_phone && ` | ${option.ss_phone}`}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="เลือก Seller *"
                InputProps={{
                  ...params.InputProps,
                  style: { fontFamily: "Kanit" },
                }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            )}
          />
          {!isView && (
            <Tooltip title="จัดการ Seller">
              <IconButton size="small" onClick={onOpenSeller} sx={{ mt: 0.5, color: PRIMARY_RED }}>
                <MdEdit />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Read-Only Details */}
        {selectedSeller && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="เลขผู้เสียภาษี"
                value={selectedSeller.ss_tax_id || "-"}
                disabled
                InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="เบอร์โทร"
                value={selectedSeller.ss_phone || "-"}
                disabled
                InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="ประเทศ"
                value={selectedSeller.ss_country || "-"}
                disabled
                InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                size="small"
                label="ที่อยู่"
                value={selectedSeller.ss_address || "-"}
                disabled
                multiline
                rows={2}
                InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                size="small"
                label="ผู้ติดต่อ"
                value={selectedSeller.ss_contact_person || "-"}
                disabled
                InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="หมายเหตุ"
                value={selectedSeller.ss_remark || "-"}
                disabled
                InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerInfoCard;
