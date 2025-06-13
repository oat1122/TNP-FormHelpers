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
  CircularProgress,
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

function BusinessTypeManager({ open, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingType, setEditingType] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");

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

  // กรองรายการประเภทธุรกิจตามคำค้นหา
  const filteredTypes = businessTypes
    ? businessTypes.filter((type) =>
        type.bt_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 23, 68, 0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2,
          background: 'linear-gradient(90deg, #ff5252 0%, #ff1744 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, transparent 65%, rgba(255, 255, 255, 0.15) 85%)',
            zIndex: 0,
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            p: 0.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <MdBusinessCenter size={24} />
        </Box>        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1, 
            fontFamily: "Kanit", 
            fontWeight: 500,
            zIndex: 1,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}
        >
          จัดการประเภทธุรกิจ
        </Typography>
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.08)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.15)',
            },
            zIndex: 1,
          }}
        >
          <MdClose />
        </IconButton>
      </DialogTitle>      <DialogContent 
        sx={{ 
          pt: 3, 
          pb: 1, 
          bgcolor: 'rgba(246, 246, 248, 0.8)',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* ส่วนค้นหา */}
        <Box 
          sx={{ 
            mb: 3, 
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 82, 82, 0.5), transparent)',
            }
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="ค้นหาประเภทธุรกิจ..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: 'white',
                borderRadius: '30px',
                transition: 'all 0.25s ease-in-out',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                "& fieldset": {
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  borderWidth: '1px',
                  transition: 'all 0.25s ease-in-out',
                },
                "&:hover": {
                  boxShadow: '0 4px 12px rgba(255, 82, 82, 0.15)',
                  transform: 'translateY(-1px)',
                },
                "&:hover fieldset": {
                  borderColor: (theme) => theme.vars.palette.error.main,
                },
                "&.Mui-focused": {
                  boxShadow: '0 6px 16px rgba(255, 82, 82, 0.2)',
                },
                "&.Mui-focused fieldset": {
                  borderColor: (theme) => theme.vars.palette.error.main,
                  borderWidth: '1px',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box 
                    sx={{ 
                      backgroundColor: 'rgba(255, 82, 82, 0.08)', 
                      borderRadius: '50%', 
                      p: 0.5,
                      color: (theme) => theme.vars.palette.error.main
                    }}
                  >
                    <MdSearch size={18} />
                  </Box>
                </InputAdornment>
              ),
            }}
          />
        </Box>        {/* ส่วนเพิ่ม/แก้ไข */}
        <Paper
          elevation={3}
          sx={{
            p: 2.8,
            mb: 3,
            borderRadius: 3,
            bgcolor: 'white',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              boxShadow: '0 8px 20px rgba(255, 82, 82, 0.15)',
              transform: 'translateY(-2px)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '4px',
              width: '100%',
              background: 'linear-gradient(90deg, #ff5252 0%, #ff1744 100%)',
            }
          }}
        >
          {editingType ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 82, 82, 0.1)',
                    p: 0.8,
                    mr: 1.5,
                    color: (theme) => theme.vars.palette.error.main
                  }}
                >
                  <MdEdit size={20} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: "Kanit",
                    fontWeight: 600,
                    color: (theme) => theme.vars.palette.error.main,
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
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                      borderRadius: 2,
                      bgcolor: "white",
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      "& fieldset": {
                        borderColor: 'transparent',
                      },
                      "&:hover": {
                        boxShadow: '0 4px 8px rgba(255, 82, 82, 0.1)',
                      },
                      "&:hover fieldset": {
                        borderColor: (theme) => `${theme.vars.palette.error.main}4D`,
                      },
                      "&.Mui-focused": {
                        boxShadow: '0 4px 12px rgba(255, 82, 82, 0.15)',
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
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
                    height: 40,
                    borderRadius: 2,
                    px: 2.5,
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(255, 82, 82, 0.25)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(255, 82, 82, 0.35)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      boxShadow: '0 2px 8px rgba(255, 82, 82, 0.2)',
                      transform: 'translateY(0)',
                    }
                  }}
                  startIcon={<MdEdit size={18} />}
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
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 500,
                    borderWidth: '1.5px',
                    '&:hover': {
                      borderWidth: '1.5px',
                      backgroundColor: 'rgba(255, 82, 82, 0.04)'
                    }
                  }}
                >
                  ยกเลิก
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 82, 82, 0.1)',
                    p: 0.8,
                    mr: 1.5,
                    color: (theme) => theme.vars.palette.error.main
                  }}
                >
                  <MdAdd size={20} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontFamily: "Kanit",
                    fontWeight: 600,
                    color: (theme) => theme.vars.palette.error.main,
                  }}
                >
                  เพิ่มประเภทธุรกิจใหม่
                </Typography>
              </Box>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="ชื่อประเภทธุรกิจ"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "white",
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      "& fieldset": {
                        borderColor: 'transparent',
                      },
                      "&:hover": {
                        boxShadow: '0 4px 8px rgba(255, 82, 82, 0.1)',
                      },
                      "&:hover fieldset": {
                        borderColor: (theme) => `${theme.vars.palette.error.main}4D`,
                      },
                      "&.Mui-focused": {
                        boxShadow: '0 4px 12px rgba(255, 82, 82, 0.15)',
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: (theme) => theme.vars.palette.error.main,
                      },
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
                    height: 40,
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(255, 82, 82, 0.25)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(255, 82, 82, 0.35)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      boxShadow: '0 2px 8px rgba(255, 82, 82, 0.2)',
                      transform: 'translateY(0)',
                    }
                  }}
                  startIcon={<MdAdd size={18} />}
                >
                  เพิ่ม
                </Button>
              </Box>
            </>
          )}
          {(isAdding || isUpdating) && (
            <Box sx={{ mt: 2, px: 1 }}>
              <LinearProgress 
                sx={{ 
                  borderRadius: 1,
                  height: 6,
                  bgcolor: 'rgba(255, 82, 82, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundImage: 'linear-gradient(90deg, #ff5252, #ff1744)'
                  }
                }} 
              />
            </Box>
          )}
        </Paper>        {/* รายการประเภทธุรกิจ */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1.5,
              position: 'relative',
            }}
          >
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #ff5252, #ff1744)',
                color: 'white',
                borderRadius: '50%',
                p: 0.8,
                display: 'flex',
                boxShadow: '0 4px 10px rgba(255, 82, 82, 0.25)',
              }}
            >
              <MdBusinessCenter size={18} />
            </Box>            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "Kanit",
                fontWeight: 600,
                color: (theme) => theme.vars.palette.text.primary,
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
                  bgcolor: 'rgba(255, 82, 82, 0.1)',
                  color: (theme) => theme.vars.palette.error.main,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {filteredTypes.length}
              </Box>
            </Typography>
          </Box>
        </Box>

        {isLoading ? (
          <Box 
            sx={{ 
              width: "100%", 
              textAlign: "center", 
              py: 5,
              borderRadius: 3,
              bgcolor: 'white', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
          >
            <CircularProgress 
              size={40} 
              thickness={4} 
              sx={{ 
                color: (theme) => theme.vars.palette.error.main 
              }} 
            />
            <Typography sx={{ fontFamily: "Kanit", color: 'text.secondary' }}>
              กำลังโหลดข้อมูล...
            </Typography>
          </Box>
        ) : filteredTypes.length > 0 ? (
          <Paper
            elevation={3}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              }
            }}
          >
            <List
              sx={{
                maxHeight: 300,
                overflow: "auto",
                bgcolor: "white",
                p: 0.5,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 82, 82, 0.3)',
                  borderRadius: '10px',
                  '&:hover': {
                    background: 'rgba(255, 82, 82, 0.5)',
                  }
                }
              }}
            >
              {filteredTypes.map((type, index) => (                <ListItem
                  key={type.bt_id}
                  divider={index !== filteredTypes.length - 1}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    "&:hover": { 
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
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
                  />                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.8 }}>
                      <Tooltip title="แก้ไข">
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => startEditing(type)}
                          sx={{
                            color: 'primary.main',
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                            p: 1,
                            '&:hover': {
                              bgcolor: 'rgba(25, 118, 210, 0.15)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
                            },
                            transition: 'all 0.2s ease',
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
                          onClick={() => handleDeleteType(type.bt_id)}
                          disabled={isDeleting}
                          sx={{
                            color: 'error.main',
                            bgcolor: 'rgba(255, 82, 82, 0.08)',
                            p: 1,
                            '&:hover': {
                              bgcolor: 'rgba(255, 82, 82, 0.15)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
                            },
                            transition: 'all 0.2s ease',
                            '&.Mui-disabled': {
                              opacity: 0.5,
                            }
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
              borderRadius: 2,
              py: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              "& .MuiAlert-icon": {
                color: (theme) => theme.vars.palette.error.main,
              },
              '& .MuiAlert-message': {
                fontWeight: 500,
              }
            }}
          >
            {searchTerm
              ? "ไม่พบประเภทธุรกิจที่ค้นหา"
              : "ยังไม่มีประเภทธุรกิจในระบบ"}
          </Alert>
        )}
      </DialogContent>{" "}      <DialogActions
        sx={{ 
          px: 3, 
          py: 2.5,
          bgcolor: (theme) => theme.vars.palette.grey.main,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.06), transparent)',
          }
        }}
      >
        <Box sx={{ ml: 'auto' }}>
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
              boxShadow: '0 4px 12px rgba(255, 82, 82, 0.25)',
              transition: 'all 0.25s ease',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(255, 82, 82, 0.35)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                boxShadow: '0 2px 8px rgba(255, 82, 82, 0.2)',
                transform: 'translateY(0)',
              }
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
