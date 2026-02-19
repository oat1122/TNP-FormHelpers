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
} from "@mui/material";
import { useState } from "react";
import { MdAdd, MdDelete, MdEdit, MdAutoFixHigh, MdClose } from "react-icons/md";
import NumericTextField from "../NumericTextField";
import { PRIMARY_RED } from "../../utils";

const CustomizationCard = ({
  options,
  setOptions,
  isView,
  selectedOptionIds = [],
  handleOptionToggle,
  // Helper to open formula for a specific option
  handleOpenOptionFormula,
}) => {
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState({
    spo_name: "",
    tiers: [],
  });

  // Open dialog to add new option
  const handleAddOption = () => {
    setCurrentOption({
      spo_name: "",
      tiers: [], // Start with empty tiers or default one?
    });
    setEditingOptionIndex(null);
    setOptionDialogOpen(true);
  };

  // Open dialog to edit existing option
  const handleEditOption = (index) => {
    setCurrentOption({ ...options[index] });
    setEditingOptionIndex(index);
    setOptionDialogOpen(true);
  };

  // Remove an option
  const handleRemoveOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  // Save option from dialog
  const handleSaveOption = () => {
    if (!currentOption.spo_name.trim()) return;

    const newOptions = [...options];
    if (editingOptionIndex !== null) {
      newOptions[editingOptionIndex] = currentOption;
    } else {
      newOptions.push({ ...currentOption, spo_is_active: true });
    }
    setOptions(newOptions);
    setOptionDialogOpen(false);
  };

  // --- Tier Management inside Dialog ---

  const handleAddTier = () => {
    const newTiers = [...(currentOption.tiers || [])];
    const lastMax = newTiers.length > 0 ? newTiers[newTiers.length - 1].max_qty : 0;
    const nextMin = lastMax ? parseInt(lastMax) + 1 : 1;

    newTiers.push({
      min_qty: nextMin,
      max_qty: null,
      price: 0,
    });
    setCurrentOption({ ...currentOption, tiers: newTiers });
  };

  const handleRemoveTier = (tierIdx) => {
    const newTiers = [...currentOption.tiers];
    newTiers.splice(tierIdx, 1);
    setCurrentOption({ ...currentOption, tiers: newTiers });
  };

  const handleTierChange = (tierIdx, field, value) => {
    const newTiers = [...currentOption.tiers];
    newTiers[tierIdx] = { ...newTiers[tierIdx], [field]: value };
    setCurrentOption({ ...currentOption, tiers: newTiers });
  };

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
                  {!isView && (
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
                        ? `${Math.min(...opt.tiers.map((t) => t.price))} - ${Math.max(
                            ...opt.tiers.map((t) => t.price)
                          )}`
                        : "0"}
                    </TableCell>
                    {!isView && (
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
            {editingOptionIndex !== null ? "แก้ไขตัวเลือก" : "เพิ่มตัวเลือกใหม่"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="ชื่อตัวเลือก (เช่น สกรีน, ปัก)"
                value={currentOption.spo_name}
                onChange={(e) => setCurrentOption({ ...currentOption, spo_name: e.target.value })}
                sx={{ mb: 3 }}
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                  ราคาของตัวเลือก (ตามจำนวนสั่งซื้อ)
                </Typography>
                {/* Future: Auto Formula for Option Tiers */}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<MdAdd />}
                  onClick={handleAddTier}
                  sx={{ fontFamily: "Kanit", fontSize: 12 }}
                >
                  เพิ่ม Tier ราคา
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontFamily: "Kanit" }}>Min</TableCell>
                      <TableCell sx={{ fontFamily: "Kanit" }}>Max</TableCell>
                      <TableCell sx={{ fontFamily: "Kanit" }}>ราคาบวกเพิ่ม (+บาท)</TableCell>
                      <TableCell />
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
                            onChange={(val) => handleTierChange(tIdx, "min_qty", val)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <NumericTextField
                            size="small"
                            decimal={false}
                            value={tier.max_qty ?? ""}
                            placeholder="ไม่จำกัด"
                            onChange={(val) => handleTierChange(tIdx, "max_qty", val)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <NumericTextField
                            size="small"
                            value={tier.price}
                            onChange={(val) => handleTierChange(tIdx, "price", val)}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveTier(tIdx)}
                          >
                            <MdDelete />
                          </IconButton>
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
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveOption}
              sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
            >
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CustomizationCard;
