import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
  Typography,
  Divider,
  Alert,
  InputAdornment,
  ListItemSecondaryAction,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdSearch,
  MdBusinessCenter,
} from "react-icons/md";
import {
  useGetAllBusinessTypesQuery,
  useAddBusinessTypeMutation,
  useUpdateBusinessTypeMutation,
  useDeleteBusinessTypeMutation,
} from "../features/globalApi";
import { open_dialog_ok_timer, open_dialog_error } from "../utils/import_lib";

function BusinessTypeManager({ open, onClose, onTypeSelected = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingType, setEditingType] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");

  // API Hooks
  const {
    data: businessTypes,
    isLoading,
    refetch,
  } = useGetAllBusinessTypesQuery();
  const [addBusinessType, { isLoading: isAdding }] =
    useAddBusinessTypeMutation();
  const [updateBusinessType, { isLoading: isUpdating }] =
    useUpdateBusinessTypeMutation();
  const [deleteBusinessType, { isLoading: isDeleting }] =
    useDeleteBusinessTypeMutation();

  // ฟังก์ชันเพิ่มประเภทธุรกิจใหม่
  const handleAddType = async () => {
    if (!newTypeName.trim()) return;

    try {
      await addBusinessType({
        bt_name: newTypeName.trim(),
      }).unwrap();

      setNewTypeName("");
      open_dialog_ok_timer("เพิ่มประเภทธุรกิจใหม่เรียบร้อย");
      refetch();
    } catch (error) {
      open_dialog_error("เกิดข้อผิดพลาดในการเพิ่มประเภทธุรกิจ", error.message);
    }
  };

  // ฟังก์ชันอัพเดทประเภทธุรกิจ
  const handleUpdateType = async () => {
    if (!editingType || !newTypeName.trim()) return;

    try {
      await updateBusinessType({
        bt_id: editingType.bt_id,
        bt_name: newTypeName.trim(),
      }).unwrap();

      setEditingType(null);
      setNewTypeName("");
      open_dialog_ok_timer("อัพเดทประเภทธุรกิจเรียบร้อย");
      refetch();
    } catch (error) {
      open_dialog_error("เกิดข้อผิดพลาดในการอัพเดทประเภทธุรกิจ", error.message);
    }
  };

  // ฟังก์ชันลบประเภทธุรกิจ
  const handleDeleteType = async (typeId) => {
    try {
      await deleteBusinessType(typeId).unwrap();
      open_dialog_ok_timer("ลบประเภทธุรกิจเรียบร้อย");
      refetch();
    } catch (error) {
      open_dialog_error(
        "เกิดข้อผิดพลาดในการลบประเภทธุรกิจ",
        error.data?.message || error.message
      );
    }
  };

  // ฟังก์ชันเริ่มแก้ไขประเภทธุรกิจ
  const startEditing = (type) => {
    setEditingType(type);
    setNewTypeName(type.bt_name);
  };

  // ฟังก์ชันยกเลิกการแก้ไข
  const cancelEditing = () => {
    setEditingType(null);
    setNewTypeName("");
  };

  // ฟังก์ชันเมื่อเลือกประเภทธุรกิจ
  const handleTypeSelect = (type) => {
    setSelectedTypeId(type.bt_id);
    if (onTypeSelected) {
      onTypeSelected(type);
    }
  };

  // กรองรายการประเภทธุรกิจตามคำค้นหา
  const filteredTypes = businessTypes
    ? businessTypes.filter((type) =>
        type.bt_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <MdBusinessCenter size={24} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          จัดการประเภทธุรกิจ
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <MdClose />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* ส่วนค้นหา */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="ค้นหาประเภทธุรกิจ..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch />
              </InputAdornment>
            ),
          }}
        />

        {/* ส่วนเพิ่ม/แก้ไข */}
        <Paper
          elevation={1}
          sx={{ p: 2, mb: 2, bgcolor: "background.default" }}
        >
          {editingType ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                แก้ไขประเภทธุรกิจ: {editingType.bt_name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="ชื่อประเภทธุรกิจใหม่"
                  variant="outlined"
                  autoFocus
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateType}
                  disabled={isUpdating || !newTypeName.trim()}
                >
                  อัพเดท
                </Button>
                <Button
                  variant="outlined"
                  onClick={cancelEditing}
                  disabled={isUpdating}
                >
                  ยกเลิก
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                เพิ่มประเภทธุรกิจใหม่
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="ชื่อประเภทธุรกิจ"
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  color="primary"
                  disabled={isAdding || !newTypeName.trim()}
                  onClick={handleAddType}
                >
                  เพิ่ม
                </Button>
              </Box>
            </>
          )}
          {(isAdding || isUpdating) && <LinearProgress sx={{ mt: 1 }} />}
        </Paper>

        {/* รายการประเภทธุรกิจ */}
        <Typography variant="subtitle1" gutterBottom>
          รายการประเภทธุรกิจทั้งหมด ({filteredTypes.length})
        </Typography>

        {isLoading ? (
          <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
            <LinearProgress />
          </Box>
        ) : filteredTypes.length > 0 ? (
          <List
            sx={{
              maxHeight: 300,
              overflow: "auto",
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          >
            {filteredTypes.map((type) => (
              <ListItem
                key={type.bt_id}
                divider
                selected={selectedTypeId === type.bt_id}
                onClick={() => handleTypeSelect(type)}
                sx={{
                  "&:hover": { bgcolor: "action.hover" },
                  cursor: "pointer",
                }}
              >
                <ListItemText primary={type.bt_name} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(type);
                    }}
                  >
                    <MdEdit />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteType(type.bt_id);
                    }}
                    disabled={isDeleting}
                  >
                    <MdDelete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            {searchTerm
              ? "ไม่พบประเภทธุรกิจที่ค้นหา"
              : "ยังไม่มีประเภทธุรกิจในระบบ"}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          ปิด
        </Button>
        {onTypeSelected && (
          <Button
            onClick={() => {
              const selected = filteredTypes.find(
                (t) => t.bt_id === selectedTypeId
              );
              if (selected) onTypeSelected(selected);
              onClose();
            }}
            variant="contained"
            color="primary"
            disabled={!selectedTypeId}
          >
            เลือกใช้งาน
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default BusinessTypeManager;
