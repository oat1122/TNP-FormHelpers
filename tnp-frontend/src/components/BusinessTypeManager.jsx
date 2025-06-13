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
  Typography,  Divider,
  Alert,
  InputAdornment,
  ListItemSecondaryAction,
  Paper,
  LinearProgress,
  Tooltip,
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
  };  // ฟังก์ชันเลือกประเภทธุรกิจ (คลิกที่รายการ)
  const handleTypeSelect = (type) => {
    setSelectedTypeId(type.bt_id);
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
      {" "}      <DialogTitle
        sx={{
          bgcolor: "white",
          color: "black",
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 1,
          borderBottom: '1px solid',
          borderColor: (theme) => theme.vars.palette.grey.outlinedInput,
        }}
      >
        <MdBusinessCenter size={24} />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontFamily: "Kanit" }}
        >
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
      </DialogTitle>      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {" "}
        {/* ส่วนค้นหา */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="ค้นหาประเภทธุรกิจ..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              bgcolor: (theme) => theme.vars.palette.grey.outlinedInput,
              "& fieldset": {
                borderColor: (theme) => theme.vars.palette.grey.outlinedInput,
              },
              "&:hover fieldset": {
                borderColor: (theme) => theme.vars.palette.error.main,
              },
              "&.Mui-focused fieldset": {
                borderColor: (theme) => theme.vars.palette.error.main,
              },
            },
          }}          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch color="#757575" />
              </InputAdornment>
            ),
          }}
        />
        </Box>
        {/* ส่วนเพิ่ม/แก้ไข */}{" "}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: (theme) => theme.vars.palette.grey.main,
            border: "1px solid",
            borderColor: (theme) => theme.vars.palette.grey.outlinedInput,
            borderRadius: 1,
          }}
        >
          {editingType ? (
            <>
              {" "}
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontFamily: "Kanit",
                  fontWeight: 500,
                  color: (theme) => theme.vars.palette.text.primary,
                }}
              >
                แก้ไขประเภทธุรกิจ: {editingType.bt_name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {" "}
                <TextField
                  fullWidth
                  size="small"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="ชื่อประเภทธุรกิจใหม่"
                  variant="outlined"
                  autoFocus
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "white",
                      "&:hover fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
                    },
                  }}
                />{" "}
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleUpdateType}
                  disabled={isUpdating || !newTypeName.trim()}
                  sx={{
                    fontFamily: "Kanit",
                    height: 40,
                  }}
                >
                  อัพเดท
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={cancelEditing}
                  disabled={isUpdating}
                  sx={{
                    fontFamily: "Kanit",
                    height: 40,
                  }}
                >
                  ยกเลิก
                </Button>
              </Box>
            </>
          ) : (
            <>
              {" "}
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{
                  fontFamily: "Kanit",
                  fontWeight: 500,
                  color: (theme) => theme.vars.palette.text.primary,
                }}
              >
                เพิ่มประเภทธุรกิจใหม่
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {" "}
                <TextField
                  fullWidth
                  size="small"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="ชื่อประเภทธุรกิจ"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "white",
                      "&:hover fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
                    },
                  }}
                />{" "}
                <Button
                  variant="contained"
                  color="error"
                  disabled={isAdding || !newTypeName.trim()}
                  onClick={handleAddType}
                  sx={{
                    fontFamily: "Kanit",
                    height: 40,
                  }}
                >
                  เพิ่ม
                </Button>
              </Box>
            </>
          )}
          {(isAdding || isUpdating) && <LinearProgress sx={{ mt: 1 }} />}
        </Paper>
        {/* รายการประเภทธุรกิจ */}{" "}
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{
            fontFamily: "Kanit",
            fontWeight: 500,
            color: (theme) => theme.vars.palette.text.primary,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MdBusinessCenter size={18} />
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
              bgcolor: "white",
              borderRadius: 1,
              border: "1px solid",
              borderColor: (theme) => theme.vars.palette.grey.outlinedInput,
            }}
          >
            {filteredTypes.map((type) => (              <ListItem
                key={type.bt_id}
                divider
                selected={selectedTypeId === type.bt_id}
                onClick={() => handleTypeSelect(type)}
                sx={{
                  cursor: "pointer",
                  ...(selectedTypeId === type.bt_id && {
                    bgcolor: (theme) => `${theme.vars.palette.error.main}1A`,
                  }),
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemText
                  primary={type.bt_name}
                  primaryTypographyProps={{
                    sx: {
                      fontFamily: "Kanit",
                      fontSize: "0.95rem",
                    },
                  }}
                />                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex' }}>
                    <Tooltip title="แก้ไข">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => startEditing(type)}
                        color="primary"
                        size="small"
                      >
                        <MdEdit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ลบ">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteType(type.bt_id)}
                        disabled={isDeleting}
                        color="error"
                        size="small"
                      >
                        <MdDelete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              fontFamily: "Kanit",
              "& .MuiAlert-icon": {
                color: (theme) => theme.vars.palette.error.main,
              },
            }}
          >
            {searchTerm
              ? "ไม่พบประเภทธุรกิจที่ค้นหา"
              : "ยังไม่มีประเภทธุรกิจในระบบ"}
          </Alert>
        )}
      </DialogContent>{" "}      <DialogActions
        sx={{ px: 3, py: 2, bgcolor: (theme) => theme.vars.palette.grey.main }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="error"
          sx={{
            fontFamily: "Kanit",
            height: 40,
          }}
        >
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
            color="error"
            disabled={!selectedTypeId}
            sx={{
              fontFamily: "Kanit",
              height: 40,
            }}
          >
            เลือกใช้งาน
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default BusinessTypeManager;
