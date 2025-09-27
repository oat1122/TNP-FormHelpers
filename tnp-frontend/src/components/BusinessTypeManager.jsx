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
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch, MdBusinessCenter } from "react-icons/md";
import Swal from "sweetalert2";

import {
  useGetAllBusinessTypesQuery,
  useAddBusinessTypeMutation,
  useUpdateBusinessTypeMutation,
  useDeleteBusinessTypeMutation,
} from "../features/globalApi";
import { open_dialog_ok_timer, open_dialog_error } from "../utils/import_lib";

function BusinessTypeManager({ open, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingType, setEditingType] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");

  // API Hooks
  const { data: businessTypes, isLoading, refetch } = useGetAllBusinessTypesQuery();
  const [addBusinessType, { isLoading: isAdding }] = useAddBusinessTypeMutation();
  const [updateBusinessType, { isLoading: isUpdating }] = useUpdateBusinessTypeMutation();
  const [deleteBusinessType, { isLoading: isDeleting }] = useDeleteBusinessTypeMutation();

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
      // ปิดหน้าจัดการประเภทธุรกิจเมื่อเพิ่มเรียบร้อย
      setTimeout(() => {
        onClose();
      }, 800);
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
      // ปิดหน้าจัดการประเภทธุรกิจเมื่อแก้ไขเรียบร้อย
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      open_dialog_error("เกิดข้อผิดพลาดในการอัพเดทประเภทธุรกิจ", error.message);
    }
  };

  // ฟังก์ชันลบประเภทธุรกิจ
  const handleDeleteType = async (typeId, typeName) => {
    try {
      // แสดงกล่องยืนยันการลบ
      const result = await Swal.fire({
        title: "ยืนยันการลบ?",
        text: `คุณต้องการลบประเภทธุรกิจ "${typeName}" ใช่หรือไม่?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "ใช่, ลบเลย",
        cancelButtonText: "ยกเลิก",
        allowOutsideClick: false,
        allowEscapeKey: false,
        focusConfirm: false,
        customClass: {
          container: "swal-container-top-layer",
          popup: "swal-popup-top",
          backdrop: "swal2-backdrop-show",
          confirmButton: "swal2-confirm",
          cancelButton: "swal2-cancel",
        },
        backdrop: `rgba(0,0,0,0.7)`,
        zIndex: 9999999,
        position: "center",
      });

      // ถ้าผู้ใช้กด "ใช่, ลบเลย"
      if (result.isConfirmed) {
        try {
          // แสดง loading ระหว่างลบ
          Swal.fire({
            title: "กำลังลบ...",
            text: "กรุณารอสักครู่",
            allowOutsideClick: false,
            customClass: {
              container: "swal-container-top-layer",
              popup: "swal-popup-top",
              backdrop: "swal2-backdrop-show",
            },
            zIndex: 9999999,
            position: "center",
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const response = await deleteBusinessType(typeId).unwrap();

          if (response.status === "success") {
            Swal.fire({
              title: "ลบเรียบร้อย!",
              text: "ประเภทธุรกิจถูกลบเรียบร้อยแล้ว",
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
              customClass: {
                container: "swal-container-top-layer",
                popup: "swal-popup-top",
                backdrop: "swal2-backdrop-show",
              },
              zIndex: 9999999,
              position: "center",
            });
            refetch();
            // ปิดหน้าจัดการประเภทธุรกิจเมื่อลบเรียบร้อย
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        } catch (error) {
          const errorMsg =
            error.data?.message ||
            "ไม่สามารถลบประเภทธุรกิจได้ เนื่องจากมีลูกค้าใช้งานประเภทธุรกิจนี้อยู่";

          Swal.fire({
            title: "ไม่สามารถลบได้",
            html: `${errorMsg}<br><br><small>คำแนะนำ: กรุณาเปลี่ยนประเภทธุรกิจของลูกค้าที่ใช้ประเภทนี้ก่อนทำการลบ</small>`,
            icon: "error",
            customClass: {
              container: "swal-container-top-layer",
              popup: "swal-popup-top",
              backdrop: "swal2-backdrop-show",
            },
            zIndex: 9999999,
            position: "center",
          });

          console.error("Delete business type error:", error);
        }
      }
    } catch (error) {
      console.error("SweetAlert error:", error);
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

  // กรองรายการประเภทธุรกิจตามคำค้นหา
  const filteredTypes = businessTypes
    ? businessTypes.filter((type) => type.bt_name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        timeout: 400,
        style: {
          transition: "transform 0.4s ease, opacity 0.4s ease",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 23, 68, 0.1)",
          animation: "dialogFadeIn 0.4s ease",
          "@keyframes dialogFadeIn": {
            "0%": {
              opacity: 0,
              transform: "translateY(20px) scale(0.98)",
            },
            "100%": {
              opacity: 1,
              transform: "translateY(0) scale(1)",
            },
          },
        },
      }}
    >
      {" "}
      <DialogTitle
        sx={{
          p: 2,
          background: "linear-gradient(90deg, #f5f5f5, #eeeeee)",
          color: "black",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(45deg, transparent 65%, rgba(255, 255, 255, 0.3) 85%)",
            zIndex: 0,
          },
        }}
      >
        {" "}
        <Box
          sx={{
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            borderRadius: "50%",
            p: 0.8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <MdBusinessCenter size={24} color="#DC2626" />
        </Box>{" "}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            fontFamily: "Kanit",
            fontWeight: 600,
            zIndex: 1,
            color: "black",
            textShadow: "0 1px 1px rgba(255, 255, 255, 0.25)",
          }}
        >
          จัดการประเภทธุรกิจ
        </Typography>{" "}
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          sx={{
            color: "black",
            bgcolor: "rgba(0, 0, 0, 0.05)",
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.12)",
            },
            zIndex: 1,
          }}
        >
          <MdClose />
        </IconButton>
      </DialogTitle>{" "}
      <DialogContent
        sx={{
          pt: 4,
          pb: 1,
          bgcolor: "rgba(246, 246, 248, 0.8)",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* ส่วนเพิ่ม/แก้ไข */}{" "}
        <Paper
          elevation={3}
          sx={{
            p: 3.5,
            pt: 4,
            pb: 4,
            mb: 4,
            mt: 1.5,
            borderRadius: 3,
            bgcolor: "white",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
            position: "relative",
            overflow: "hidden",
            "&:hover": {
              boxShadow: "0 8px 20px rgba(255, 82, 82, 0.15)",
              transform: "translateY(-2px)",
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              height: "4px",
              width: "100%",
              background: "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)",
            },
          }}
        >
          {editingType ? (
            <>
              {" "}
              <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                {" "}
                <Box
                  sx={{
                    borderRadius: "50%",
                    bgcolor: "rgba(220, 38, 38, 0.1)",
                    p: 1.2,
                    mr: 2,
                    color: "#DC2626",
                  }}
                >
                  <MdEdit size={22} />
                </Box>{" "}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: "Kanit",
                    fontWeight: 600,
                    fontSize: "1.05rem",
                    color: "black",
                  }}
                >
                  แก้ไขประเภทธุรกิจ:
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 500,
                      ml: 0.5,
                      color: (theme) => theme.vars.palette.text.primary,
                    }}
                  >
                    {editingType.bt_name}
                  </Typography>
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <TextField
                  fullWidth
                  size="medium"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="ชื่อประเภทธุรกิจใหม่"
                  variant="outlined"
                  autoFocus
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "white",
                      minHeight: 48,
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                      transition: "all 0.2s ease",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      "& fieldset": {
                        borderColor: "transparent",
                      },
                      "&:hover": {
                        boxShadow: "0 4px 8px rgba(255, 82, 82, 0.1)",
                      },
                      "&:hover fieldset": {
                        borderColor: (theme) => `${theme.vars.palette.error.main}4D`,
                      },
                      "&.Mui-focused": {
                        boxShadow: "0 4px 12px rgba(255, 82, 82, 0.15)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
                    },
                    "& .MuiInputBase-input": {
                      padding: "12px 16px",
                      fontSize: "1rem",
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleUpdateType}
                  disabled={isUpdating || !newTypeName.trim()}
                  sx={{
                    fontFamily: "Kanit",
                    height: 48,
                    minWidth: 110,
                    borderRadius: 2,
                    px: 2.5,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    boxShadow: "0 4px 12px rgba(255, 82, 82, 0.25)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 6px 16px rgba(255, 82, 82, 0.35)",
                      transform: "translateY(-2px)",
                    },
                    "&:active": {
                      boxShadow: "0 2px 8px rgba(255, 82, 82, 0.2)",
                      transform: "translateY(0)",
                    },
                  }}
                  startIcon={<MdEdit size={20} />}
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
                    height: 48,
                    minWidth: 90,
                    borderRadius: 2,
                    px: 2,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    borderWidth: "1.5px",
                    "&:hover": {
                      borderWidth: "1.5px",
                      backgroundColor: "rgba(255, 82, 82, 0.04)",
                    },
                  }}
                >
                  ยกเลิก
                </Button>
              </Box>
            </>
          ) : (
            <>
              {" "}
              <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                {" "}
                <Box
                  sx={{
                    borderRadius: "50%",
                    bgcolor: "rgba(220, 38, 38, 0.1)",
                    p: 1.2,
                    mr: 2,
                    color: "#DC2626",
                  }}
                >
                  <MdAdd size={22} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: "Kanit",
                    fontWeight: 600,
                    fontSize: "1.05rem",
                    color: "black",
                  }}
                >
                  เพิ่มประเภทธุรกิจใหม่
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <TextField
                  fullWidth
                  size="medium"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="ชื่อประเภทธุรกิจ"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "white",
                      minHeight: 48,
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                      transition: "all 0.2s ease",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      "& fieldset": {
                        borderColor: "transparent",
                      },
                      "&:hover": {
                        boxShadow: "0 4px 8px rgba(255, 82, 82, 0.1)",
                      },
                      "&:hover fieldset": {
                        borderColor: (theme) => `${theme.vars.palette.error.main}4D`,
                      },
                      "&.Mui-focused": {
                        boxShadow: "0 4px 12px rgba(255, 82, 82, 0.15)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
                    },
                    "& .MuiInputBase-input": {
                      padding: "12px 16px",
                      fontSize: "1rem",
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="error"
                  disabled={isAdding || !newTypeName.trim()}
                  onClick={handleAddType}
                  sx={{
                    fontFamily: "Kanit",
                    height: 48,
                    minWidth: 120,
                    borderRadius: 2,
                    px: 2.5,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    boxShadow: "0 4px 12px rgba(255, 82, 82, 0.25)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 6px 16px rgba(255, 82, 82, 0.35)",
                      transform: "translateY(-2px)",
                    },
                    "&:active": {
                      boxShadow: "0 2px 8px rgba(255, 82, 82, 0.2)",
                      transform: "translateY(0)",
                    },
                  }}
                  startIcon={<MdAdd size={20} />}
                >
                  เพิ่ม
                </Button>
              </Box>
            </>
          )}{" "}
          {(isAdding || isUpdating) && (
            <Box sx={{ mt: 3, px: 1 }}>
              {" "}
              <LinearProgress
                sx={{
                  borderRadius: 1.5,
                  height: 8,
                  bgcolor: "rgba(220, 38, 38, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundImage: "linear-gradient(90deg, #EF4444, #DC2626)",
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1.5,
                  textAlign: "center",
                  color: "#DC2626",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                }}
              >
                กำลังดำเนินการ...
              </Typography>
            </Box>
          )}
        </Paper>{" "}
        {/* รายการประเภทธุรกิจ */} {/* ส่วนค้นหาและหัวข้อรายการ */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 2.5,
            gap: 2,
          }}
        >
          {" "}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              position: "relative",
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #EF4444, #DC2626)",
                color: "white",
                borderRadius: "50%",
                p: 0.8,
                display: "flex",
                boxShadow: "0 4px 10px rgba(220, 38, 38, 0.25)",
              }}
            >
              <MdBusinessCenter size={18} />
            </Box>{" "}
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Kanit",
                fontWeight: 600,
                color: "black",
              }}
            >
              รายการประเภทธุรกิจทั้งหมด
              <Box
                component="span"
                sx={{
                  ml: 0.8,
                  px: 1.2,
                  py: 0.1,
                  borderRadius: 10,
                  bgcolor: "rgba(220, 38, 38, 0.1)",
                  color: "#DC2626",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                {filteredTypes.length}
              </Box>
            </Typography>
          </Box>
          {/* ส่วนค้นหา */}
          <Box sx={{ minWidth: 220, maxWidth: 280, width: "40%" }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="ค้นหาประเภทธุรกิจ..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "white",
                  borderRadius: "30px",
                  transition: "all 0.25s ease-in-out",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  "& fieldset": {
                    borderColor: "rgba(0, 0, 0, 0.12)",
                    borderWidth: "1px",
                    transition: "all 0.25s ease-in-out",
                  },
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(255, 82, 82, 0.15)",
                    transform: "translateY(-1px)",
                  },
                  "&:hover fieldset": {
                    borderColor: (theme) => theme.vars.palette.error.main,
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 6px 16px rgba(255, 82, 82, 0.2)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: (theme) => theme.vars.palette.error.main,
                    borderWidth: "1px",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        backgroundColor: "rgba(220, 38, 38, 0.08)",
                        borderRadius: "50%",
                        p: 0.5,
                        color: "#DC2626",
                      }}
                    >
                      <MdSearch size={18} />
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
        {isLoading ? (
          <Box
            sx={{
              width: "100%",
              textAlign: "center",
              py: 6,
              px: 3,
              borderRadius: 3,
              bgcolor: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.07)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "4px",
                background: "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)",
              },
            }}
          >
            {" "}
            <CircularProgress
              size={48}
              thickness={4}
              sx={{
                color: "#DC2626",
                animation: "pulse 2s infinite ease-in-out",
                "@keyframes pulse": {
                  "0%": { opacity: 0.6, transform: "scale(0.97)" },
                  "50%": { opacity: 1, transform: "scale(1)" },
                  "100%": { opacity: 0.6, transform: "scale(0.97)" },
                },
              }}
            />
            <Typography
              sx={{
                fontFamily: "Kanit",
                color: "text.secondary",
                fontWeight: 500,
                fontSize: "1rem",
              }}
            >
              กำลังโหลดข้อมูล...
            </Typography>
          </Box>
        ) : filteredTypes.length > 0 ? (
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
              },
            }}
          >
            {" "}
            <List
              sx={{
                maxHeight: 340,
                overflow: "auto",
                bgcolor: "white",
                p: 1,
                py: 1.5,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "rgba(0, 0, 0, 0.03)",
                  borderRadius: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(220, 38, 38, 0.3)",
                  borderRadius: "10px",
                  "&:hover": {
                    background: "rgba(220, 38, 38, 0.5)",
                  },
                },
              }}
            >
              {filteredTypes.map((type, index) => (
                <ListItem
                  key={type.bt_id}
                  divider={index !== filteredTypes.length - 1}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 1.2,
                    px: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <ListItemText
                    primary={type.bt_name}
                    primaryTypographyProps={{
                      sx: {
                        fontFamily: "Kanit",
                        fontSize: "1rem",
                        fontWeight: 500,
                      },
                    }}
                  />
                  <ListItemSecondaryAction>
                    {" "}
                    <Box sx={{ display: "flex", gap: 1.2 }}>
                      <Tooltip title="แก้ไข">
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => startEditing(type)}
                          sx={{
                            color: "primary.main",
                            bgcolor: "rgba(25, 118, 210, 0.08)",
                            p: 1.2,
                            "&:hover": {
                              bgcolor: "rgba(25, 118, 210, 0.15)",
                              transform: "translateY(-2px)",
                              boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          size="small"
                        >
                          <MdEdit size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteType(type.bt_id, type.bt_name)}
                          sx={{
                            color: "error.main",
                            bgcolor: "rgba(211, 47, 47, 0.08)",
                            p: 1.2,
                            "&:hover": {
                              bgcolor: "rgba(211, 47, 47, 0.15)",
                              transform: "translateY(-2px)",
                              boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          size="small"
                        >
                          <MdDelete size={20} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          <Alert
            severity="info"
            sx={{
              mb: 2,
              fontFamily: "Kanit",
              borderRadius: 3,
              py: 3,
              px: 3,
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.07)",
              "& .MuiAlert-icon": {
                color: (theme) => theme.vars.palette.error.main,
                fontSize: "1.75rem",
                mr: 2,
              },
              "& .MuiAlert-message": {
                fontWeight: 500,
                fontSize: "1rem",
              },
            }}
          >
            {searchTerm ? "ไม่พบประเภทธุรกิจที่ค้นหา" : "ยังไม่มีประเภทธุรกิจในระบบ"}
          </Alert>
        )}
      </DialogContent>{" "}
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: (theme) => theme.vars.palette.grey.main,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.06), transparent)",
          },
        }}
      >
        <Box sx={{ ml: "auto" }}>
          <Button
            onClick={onClose}
            variant="contained"
            color="error"
            sx={{
              fontFamily: "Kanit",
              height: 44,
              borderRadius: 2.5,
              px: 3,
              minWidth: 120,
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(255, 82, 82, 0.25)",
              transition: "all 0.25s ease",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(255, 82, 82, 0.35)",
                transform: "translateY(-2px)",
              },
              "&:active": {
                boxShadow: "0 2px 8px rgba(255, 82, 82, 0.2)",
                transform: "translateY(0)",
              },
            }}
          >
            ปิด
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default BusinessTypeManager;
