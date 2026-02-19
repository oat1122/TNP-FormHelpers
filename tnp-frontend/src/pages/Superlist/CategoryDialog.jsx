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
} from "@mui/material";
import { MdClose, MdEdit, MdSave, MdDelete, MdAdd } from "react-icons/md";

import { useCategoryManagement } from "./hooks";
import { PRIMARY_RED } from "./utils";

/**
 * CategoryDialog - Dialog for managing product categories
 * Refactored to use custom hook
 */
const CategoryDialog = ({ open, onClose }) => {
  const {
    // Data
    categories,

    // New category state
    newCategory,
    setNewCategory,

    // Edit state
    editingCategory,
    editForm,
    setEditForm,

    // Handlers
    handleAdd,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDelete,
  } = useCategoryManagement();

  const handleClose = () => {
    handleCancelEdit();
    setNewCategory({ name: "", prefix: "" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { fontFamily: "Kanit" },
      }}
    >
      <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
        จัดการหมวดหมู่สินค้า
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <MdClose />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Add New Category */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", mb: 1, fontWeight: 600 }}>
            เพิ่มหมวดหมู่ใหม่
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              label="ชื่อหมวดหมู่"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              sx={{ flex: 1 }}
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
            <TextField
              size="small"
              label="SKU Prefix"
              value={newCategory.prefix}
              onChange={(e) => setNewCategory({ ...newCategory, prefix: e.target.value })}
              sx={{ width: 150 }}
              InputProps={{ style: { fontFamily: "Kanit" } }}
              InputLabelProps={{ style: { fontFamily: "Kanit" } }}
            />
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={handleAdd}
              sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
            >
              เพิ่ม
            </Button>
          </Box>
        </Box>

        {/* Categories List */}
        <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", mb: 1, fontWeight: 600 }}>
          หมวดหมู่ทั้งหมด
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ชื่อหมวดหมู่</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>SKU Prefix</TableCell>
                <TableCell align="right" sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.spc_id}>
                  <TableCell sx={{ fontFamily: "Kanit" }}>
                    {editingCategory === cat.spc_id ? (
                      <TextField
                        size="small"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        fullWidth
                        InputProps={{ style: { fontFamily: "Kanit" } }}
                      />
                    ) : (
                      cat.spc_name
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit" }}>
                    {editingCategory === cat.spc_id ? (
                      <TextField
                        size="small"
                        value={editForm.prefix}
                        onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                        fullWidth
                        InputProps={{ style: { fontFamily: "Kanit" } }}
                      />
                    ) : (
                      cat.spc_sku_prefix || "-"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingCategory === cat.spc_id ? (
                      <>
                        <IconButton
                          size="small"
                          onClick={handleSaveEdit}
                          sx={{ color: "success.main" }}
                        >
                          <MdSave />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancelEdit}>
                          <MdClose />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => handleStartEdit(cat)}>
                          <MdEdit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(cat)}
                          sx={{ color: PRIMARY_RED }}
                        >
                          <MdDelete />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ fontFamily: "Kanit", py: 3 }}>
                    ยังไม่มีหมวดหมู่
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} sx={{ fontFamily: "Kanit" }}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDialog;
