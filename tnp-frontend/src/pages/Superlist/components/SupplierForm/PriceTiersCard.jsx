import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { MdAutoFixHigh, MdAdd, MdDelete } from "react-icons/md";
import NumericTextField from "../NumericTextField";
import { PRIMARY_RED } from "../../utils";

/**
 * PriceTiersCard - Card for displaying and editing price scaling tiers
 */
const PriceTiersCard = ({
  priceTiers,
  isView,
  form,
  handleOpenFormula,
  handleAddTier,
  handleTierQtyChange,
  handleTierPriceChange,
  handleRemoveTier,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
            ขั้นบันไดราคา (Price Scaling)
          </Typography>
          {!isView && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MdAutoFixHigh />}
                onClick={() => {
                  const thbPrice = parseFloat(form.sp_price_thb) || parseFloat(form.sp_base_price);
                  handleOpenFormula(thbPrice);
                }}
                sx={{
                  fontFamily: "Kanit",
                  borderColor: PRIMARY_RED,
                  color: PRIMARY_RED,
                  fontSize: 12,
                }}
              >
                Auto Formula
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MdAdd />}
                onClick={() => handleAddTier(form.sp_base_price)}
                sx={{ fontFamily: "Kanit", fontSize: 12 }}
              >
                เพิ่ม Tier
              </Button>
            </Box>
          )}
        </Box>

        {priceTiers.length === 0 ? (
          <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
            ยังไม่มีขั้นบันไดราคา — กด &quot;Auto Formula&quot; เพื่อคำนวณอัตโนมัติ
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ลำดับ</TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>จำนวนขั้นต่ำ</TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>จำนวนสูงสุด</TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ราคาต่อหน่วย</TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ประเภท</TableCell>
                  {!isView && (
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }} align="center">
                      ลบ
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {priceTiers.map((tier, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontFamily: "Kanit" }}>{idx + 1}</TableCell>
                    <TableCell>
                      <NumericTextField
                        size="small"
                        decimal={false}
                        value={tier.min_qty}
                        onChange={(val) => handleTierQtyChange(idx, "min_qty", val)}
                        disabled={isView}
                        sx={{ width: 100 }}
                        InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <NumericTextField
                        size="small"
                        decimal={false}
                        value={tier.max_qty ?? ""}
                        placeholder="ไม่จำกัด"
                        onChange={(val) => handleTierQtyChange(idx, "max_qty", val)}
                        disabled={isView}
                        sx={{ width: 100 }}
                        InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <NumericTextField
                        size="small"
                        value={tier.price}
                        onChange={(val) => handleTierPriceChange(idx, val)}
                        disabled={isView}
                        sx={{ width: 120 }}
                        InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tier.is_auto ? "Auto" : "Manual"}
                        size="small"
                        color={tier.is_auto ? "success" : "warning"}
                        sx={{ fontFamily: "Kanit", fontSize: 11 }}
                      />
                    </TableCell>
                    {!isView && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveTier(idx)}
                          sx={{ color: PRIMARY_RED }}
                        >
                          <MdDelete size={16} />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceTiersCard;
