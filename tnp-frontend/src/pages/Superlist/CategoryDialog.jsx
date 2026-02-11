import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSave,
  MdClose,
  MdCheck,
} from "react-icons/md";
import Swal from "sweetalert2";

import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../../features/Superlist/supplierApi";

const PRIMARY_RED = "#C1272D";

const CategoryDialog = ({ open, onClose }) => {
  const { data: categoriesData, isLoading } = useGetCategoriesQuery(undefined, {
    skip: !open,
  });
  const [addCategory, { isLoading: adding }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: updating }] =
    useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = categoriesData?.data || [];

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    mpc_name: "",
    mpc_sku_prefix: "",
    mpc_remark: "",
  });

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    mpc_name: "",
    mpc_sku_prefix: "",
    mpc_remark: "",
  });

  const handleAdd = async () => {
    if (!addForm.mpc_name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อหมวดหมู่", "warning");
      return;
    }
    try {
      const res = await addCategory(addForm).unwrap();
      Swal.fire("", res.message || "สร้างสำเร็จ", "success");
      setAddForm({ mpc_name: "", mpc_sku_prefix: "", mpc_remark: "" });
      setShowAdd(false);
    } catch (err) {
      Swal.fire("", err?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleStartEdit = (cat) => {
    setEditId(cat.mpc_id);
    setEditForm({
      mpc_name: cat.mpc_name || "",
      mpc_sku_prefix: cat.mpc_sku_prefix || "",
      mpc_remark: cat.mpc_remark || "",
    });
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm.mpc_name.trim()) {
      Swal.fire("", "กรุณาใส่ชื่อหมวดหมู่", "warning");
      return;
    }
    try {
      const res = await updateCategory({
        id: editId,
        ...editForm,
      }).unwrap();
      Swal.fire("", res.message || "แก้ไขสำเร็จ", "success");
      setEditId(null);
    } catch (err) {
      Swal.fire("", err?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleDelete = async (cat) => {
    const result = await Swal.fire({
      title: "ลบหมวดหมู่?",
      text: `ต้องการลบ "${cat.mpc_name}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: PRIMARY_RED,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await deleteCategory(cat.mpc_id).unwrap();
      Swal.fire("", res.message || "ลบสำเร็จ", "success");
    } catch (err) {
      Swal.fire("", err?.data?.message || "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleClose = () => {
    setShowAdd(false);
    setEditId(null);
    setAddForm({ mpc_name: "", mpc_sku_prefix: "", mpc_remark: "" });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontFamily: "Kanit",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        จัดการหมวดหมู่สินค้า
        {!showAdd && (
          <Button
            size="small"
            variant="contained"
            startIcon={<MdAdd />}
            onClick={() => setShowAdd(true)}
            sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED, fontSize: 12 }}
          >
            เพิ่มหมวดหมู่
          </Button>
        )}
      </DialogTitle>

      <DialogContent>
        {/* Add Form */}
        {showAdd && (
          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 2, bgcolor: "#fafafa", borderColor: PRIMARY_RED }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 1.5 }}
            >
              เพิ่มหมวดหมู่ใหม่
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <TextField
                size="small"
                label="ชื่อหมวดหมู่ *"
                value={addForm.mpc_name}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, mpc_name: e.target.value }))
                }
                InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                sx={{ flex: 1, minWidth: 160 }}
              />
              <TextField
                size="small"
                label="SKU Prefix"
                value={addForm.mpc_sku_prefix}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    mpc_sku_prefix: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="เช่น FAB, ACC"
                InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                inputProps={{ maxLength: 10 }}
                sx={{ width: 120 }}
              />
              <TextField
                size="small"
                label="หมายเหตุ"
                value={addForm.mpc_remark}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, mpc_remark: e.target.value }))
                }
                InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                sx={{ flex: 1, minWidth: 140 }}
              />
              <Button
                variant="contained"
                startIcon={adding ? <CircularProgress size={14} /> : <MdCheck />}
                onClick={handleAdd}
                disabled={adding}
                sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED, fontSize: 12 }}
              >
                บันทึก
              </Button>
              <Button
                variant="outlined"
                startIcon={<MdClose />}
                onClick={() => {
                  setShowAdd(false);
                  setAddForm({ mpc_name: "", mpc_sku_prefix: "", mpc_remark: "" });
                }}
                sx={{ fontFamily: "Kanit", fontSize: 12 }}
              >
                ยกเลิก
              </Button>
            </Box>
          </Paper>
        )}

        {/* Category Table */}
        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell
                    sx={{ fontFamily: "Kanit", fontWeight: 600, width: 50 }}
                  >
                    #
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                    ชื่อหมวดหมู่
                  </TableCell>
                  <TableCell
                    sx={{ fontFamily: "Kanit", fontWeight: 600, width: 120 }}
                  >
                    SKU Prefix
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                    หมายเหตุ
                  </TableCell>
                  <TableCell
                    sx={{ fontFamily: "Kanit", fontWeight: 600, width: 100 }}
                    align="center"
                  >
                    จัดการ
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{ fontFamily: "Kanit", textAlign: "center", py: 3 }}
                    >
                      ยังไม่มีหมวดหมู่
                    </TableCell>
                  </TableRow>
                )}
                {categories.map((cat, idx) => (
                  <TableRow key={cat.mpc_id}>
                    <TableCell sx={{ fontFamily: "Kanit" }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      {editId === cat.mpc_id ? (
                        <TextField
                          size="small"
                          value={editForm.mpc_name}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              mpc_name: e.target.value,
                            }))
                          }
                          InputProps={{
                            style: { fontFamily: "Kanit", fontSize: 13 },
                          }}
                          fullWidth
                        />
                      ) : (
                        <Typography
                          sx={{ fontFamily: "Kanit", fontSize: 13 }}
                        >
                          {cat.mpc_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === cat.mpc_id ? (
                        <TextField
                          size="small"
                          value={editForm.mpc_sku_prefix}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              mpc_sku_prefix: e.target.value.toUpperCase(),
                            }))
                          }
                          inputProps={{ maxLength: 10 }}
                          InputProps={{
                            style: { fontFamily: "Kanit", fontSize: 13 },
                          }}
                          sx={{ width: 100 }}
                        />
                      ) : (
                        <Chip
                          label={cat.mpc_sku_prefix || "-"}
                          size="small"
                          variant={cat.mpc_sku_prefix ? "filled" : "outlined"}
                          color={cat.mpc_sku_prefix ? "error" : "default"}
                          sx={{ fontFamily: "Kanit", fontSize: 11 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === cat.mpc_id ? (
                        <TextField
                          size="small"
                          value={editForm.mpc_remark}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              mpc_remark: e.target.value,
                            }))
                          }
                          InputProps={{
                            style: { fontFamily: "Kanit", fontSize: 13 },
                          }}
                          fullWidth
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "Kanit", color: "text.secondary" }}
                        >
                          {cat.mpc_remark || "-"}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {editId === cat.mpc_id ? (
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          <Tooltip title="บันทึก">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={handleSaveEdit}
                              disabled={updating}
                            >
                              {updating ? (
                                <CircularProgress size={16} />
                              ) : (
                                <MdSave />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ยกเลิก">
                            <IconButton
                              size="small"
                              onClick={handleCancelEdit}
                            >
                              <MdClose />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          <Tooltip title="แก้ไข">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleStartEdit(cat)}
                            >
                              <MdEdit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(cat)}
                            >
                              <MdDelete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ fontFamily: "Kanit" }}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDialog;
