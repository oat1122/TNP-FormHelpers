/**
 * CustomizationCard - Card for managing product options (Add-ons) and their price tiers
 */
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Alert,
  Switch,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useState } from "react";
import { MdAdd, MdDelete, MdEdit, MdAutoFixHigh, MdClose, MdVisibility } from "react-icons/md";
import NumericTextField from "../NumericTextField";
import { PRIMARY_RED } from "../../utils";
import Swal from "sweetalert2";
import { useCustomizationCard } from "../../hooks";

const CustomizationCard = ({
  options,
  setOptions,
  isView,
  selectedOptionIds = [],
  priceTiers = [],
  currency = "THB",
  exchangeRate = 1,
  basePrice = 0,
  handleOptionToggle,
}) => {
  const {
    editingOptionIndex,
    optionDialogOpen,
    setOptionDialogOpen,
    isViewingOption,
    currentOption,
    setCurrentOption,
    optBasePrice,
    setOptBasePrice,
    optScaleMode,
    optCurrency,
    optPriceTHB,
    setOptPriceTHB,
    handleAddOption,
    handleEditOption,
    handleViewOption,
    handleRemoveOption,
    handleSaveOption,
    handleConvert,
    handleAutoFormula,
    handleScaleModeChange,
    handleTierDiscountChange,
    handleTierPriceChange,
  } = useCustomizationCard({
    options,
    setOptions,
    priceTiers,
    currency,
    exchangeRate,
  });

  // Re-sync if currency/exchange rate changes?
  // Probably not needed dynamically unless modal is open.

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
            ตัวเลือกเสริม (Customizations)
          </Typography>
          {!isView && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<MdAdd />}
              onClick={handleAddOption}
              sx={{ fontFamily: "Kanit", fontSize: 12 }}
            >
              เพิ่มตัวเลือก
            </Button>
          )}
        </Box>

        {options.length === 0 ? (
          <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
            ไม่มีตัวเลือกเสริม
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {isView && <TableCell sx={{ width: 50 }} />}
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ชื่อตัวเลือก</TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ราคา (บาท)</TableCell>
                  {isView ? (
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }} align="right">
                      ดูราคา
                    </TableCell>
                  ) : (
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }} align="right">
                      จัดการ
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {options.map((opt, idx) => (
                  <TableRow key={idx} selected={isView && selectedOptionIds.includes(opt.spo_id)}>
                    {isView && (
                      <TableCell>
                        <Switch
                          size="small"
                          checked={selectedOptionIds.includes(opt.spo_id)}
                          onChange={() => {
                            if (handleOptionToggle) handleOptionToggle(opt.spo_id);
                          }}
                          color="primary"
                        />
                      </TableCell>
                    )}
                    <TableCell sx={{ fontFamily: "Kanit" }}>{opt.spo_name}</TableCell>
                    <TableCell sx={{ fontFamily: "Kanit" }}>
                      {opt.tiers?.length > 0
                        ? `${Math.min(...opt.tiers.map((t) => t.price || 0))} - ${Math.max(
                            ...opt.tiers.map((t) => t.price || 0)
                          )}`
                        : "0"}
                    </TableCell>
                    {isView ? (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewOption(idx)}
                        >
                          <MdVisibility />
                        </IconButton>
                      </TableCell>
                    ) : (
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEditOption(idx)}>
                          <MdEdit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveOption(idx)}
                        >
                          <MdDelete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialog for Add/Edit Option */}
        <Dialog
          open={optionDialogOpen}
          onClose={() => setOptionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
            {isViewingOption
              ? "รายละเอียดราคาตัวเลือก"
              : editingOptionIndex !== null
                ? "แก้ไขตัวเลือก"
                : "เพิ่มตัวเลือกใหม่"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="ชื่อตัวเลือก (เช่น สกรีน, ปัก)"
                value={currentOption.spo_name}
                onChange={(e) => setCurrentOption({ ...currentOption, spo_name: e.target.value })}
                disabled={isViewingOption}
                sx={{ mb: 3 }}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />

              {/* Pricing Helper Section */}
              <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 1 }}>
                ราคาและสกุลเงิน
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
                <TextField
                  size="small"
                  label="สกุลเงิน"
                  value={optCurrency}
                  disabled
                  sx={{ width: 100 }}
                  InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                />
                <NumericTextField
                  size="small"
                  label="ราคาพื้นฐาน"
                  value={optBasePrice}
                  onChange={(val) => {
                    setOptBasePrice(val);
                  }}
                  disabled={isViewingOption}
                  sx={{ width: 140 }}
                />
                {!isViewingOption && (
                  <Button
                    variant="outlined"
                    onClick={handleConvert}
                    disabled={!optBasePrice}
                    sx={{ fontFamily: "Kanit" }}
                  >
                    แปลงเป็นบาท
                  </Button>
                )}

                <NumericTextField
                  size="small"
                  label="ราคา (บาท)"
                  value={optPriceTHB}
                  onChange={setOptPriceTHB}
                  disabled={isViewingOption}
                  sx={{ width: 140 }}
                />

                <TextField
                  size="small"
                  label="อัตราแลกเปลี่ยน"
                  value={exchangeRate || 1}
                  disabled
                  sx={{ width: 120 }}
                  InputProps={{ style: { fontFamily: "Kanit", backgroundColor: "#f5f5f5" } }}
                />
              </Box>

              {/* Radio Group โหมดสเกลราคา */}
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", gap: 3 }}>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={optScaleMode === "percent"}
                        onChange={() => handleScaleModeChange("percent")}
                        disabled={isViewingOption}
                        size="small"
                        sx={{
                          color: PRIMARY_RED,
                          "&.Mui-checked": {
                            color: PRIMARY_RED,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                        ลดเป็นเปอร์เซ็นต์ (%)
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Radio
                        checked={optScaleMode === "fixed"}
                        onChange={() => handleScaleModeChange("fixed")}
                        disabled={isViewingOption}
                        size="small"
                        sx={{
                          color: PRIMARY_RED,
                          "&.Mui-checked": {
                            color: PRIMARY_RED,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontFamily: "Kanit", fontSize: 14 }}>
                        ลดเป็นจำนวนเงินตายตัว (บาท)
                      </Typography>
                    }
                  />
                </Box>

                {/* ปุ่ม Auto Formula (ซ่อนในโหมด View) */}
                {!isViewingOption && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<MdAutoFixHigh />}
                    onClick={() => handleAutoFormula(basePrice)}
                    disabled={!optPriceTHB || !basePrice || priceTiers.length === 0}
                    sx={{ fontFamily: "Kanit", color: PRIMARY_RED, borderColor: PRIMARY_RED }}
                  >
                    Auto Formula
                  </Button>
                )}
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontFamily: "Kanit" }}>จำนวนขั้นต่ำ</TableCell>
                      <TableCell sx={{ fontFamily: "Kanit" }}>จำนวนสูงสุด</TableCell>
                      <TableCell sx={{ fontFamily: "Kanit", color: PRIMARY_RED }}>
                        {optScaleMode === "percent" ? "ส่วนลด (%)" : "ส่วนลด (บาท)"}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "Kanit" }}>ราคาบวกเพิ่ม (+บาท)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(currentOption.tiers || []).map((tier, tIdx) => (
                      <TableRow key={tIdx}>
                        <TableCell>
                          <NumericTextField
                            size="small"
                            decimal={false}
                            value={tier.min_qty}
                            disabled={true}
                            sx={{ width: 80, bgcolor: "#f5f5f5" }}
                          />
                        </TableCell>
                        <TableCell>
                          <NumericTextField
                            size="small"
                            decimal={false}
                            value={tier.max_qty ?? ""}
                            placeholder="ไม่จำกัด"
                            disabled={true}
                            sx={{ width: 80, bgcolor: "#f5f5f5" }}
                          />
                        </TableCell>
                        <TableCell>
                          <NumericTextField
                            size="small"
                            value={tier.discount}
                            onChange={(val) => handleTierDiscountChange(tIdx, val)}
                            disabled={!optPriceTHB || isViewingOption}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <NumericTextField
                            size="small"
                            value={tier.price}
                            onChange={(val) => handleTierPriceChange(tIdx, val)}
                            disabled={isViewingOption}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOptionDialogOpen(false)} sx={{ fontFamily: "Kanit" }}>
              {isViewingOption ? "ปิด" : "ยกเลิก"}
            </Button>
            {!isViewingOption && (
              <Button
                variant="contained"
                onClick={handleSaveOption}
                sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
              >
                บันทึก
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CustomizationCard;
