import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Chip,
  Backdrop,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Alert,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

import {
  useAssignCustomersMutation,
  useGetSalesBySubRoleQuery,
} from "../../../features/Customer/customerApi";

/**
 * AssignDialog - Dialog for assigning customers to sales users with conflict handling
 *
 * Filters users by subordinate sub_role based on current user's sub_role:
 * - HEAD_ONLINE → shows only SALES_ONLINE
 * - HEAD_OFFLINE → shows only SALES_OFFLINE
 * - Admin → shows all
 */
const AssignDialog = ({ open, onClose, selectedIds, onSuccess, onError, userSubRole }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const [assignCustomers] = useAssignCustomersMutation();

  // Determine sub_role_codes to fetch based on current user's sub_role
  const subRoleCodes = useMemo(() => {
    if (userSubRole === "HEAD_ONLINE") return "SALES_ONLINE";
    if (userSubRole === "HEAD_OFFLINE") return "SALES_OFFLINE";
    // Admin or manager sees all
    return "SALES_ONLINE,SALES_OFFLINE";
  }, [userSubRole]);

  // Fetch sales users using RTK Query - skip when dialog is closed
  const {
    data: salesData,
    isLoading: loadingUsers,
    error: salesError,
  } = useGetSalesBySubRoleQuery(subRoleCodes, { skip: !open });

  const salesUsers = salesData?.data || [];

  // Handle sales fetch error
  useEffect(() => {
    if (salesError) {
      console.error("Failed to fetch sales users by sub_role", salesError);
      onError("ไม่สามารถโหลดรายชื่อเซลล์ได้");
    }
  }, [salesError, onError]);

  // Get label for who can be assigned
  const getAssignLabel = () => {
    if (userSubRole === "HEAD_ONLINE") return "เลือกเซลล์ทีม Online";
    if (userSubRole === "HEAD_OFFLINE") return "เลือกเซลล์ทีม Offline";
    return "เลือกเซลล์ผู้รับผิดชอบ";
  };

  const handleConfirmAssign = async () => {
    if (!selectedUser) return;

    setAssignLoading(true);
    try {
      await assignCustomers({
        customer_ids: selectedIds,
        sales_user_id: selectedUser.user_id,
        force: false,
      }).unwrap();

      onSuccess(selectedIds.length);
      handleClose();
    } catch (err) {
      // Check for conflict (409 status or conflict flag)
      if (err.status === 409 || err.data?.conflict) {
        setConflictData(err.data);
        setShowConflictDialog(true);
      } else {
        onError(err.data?.message || "เกิดข้อผิดพลาดในการจัดสรร");
      }
    } finally {
      setAssignLoading(false);
    }
  };

  const handleForceAssign = async () => {
    if (!selectedUser) return;

    setAssignLoading(true);
    try {
      await assignCustomers({
        customer_ids: selectedIds,
        sales_user_id: selectedUser.user_id,
        force: true,
      }).unwrap();

      onSuccess(selectedIds.length);
      setShowConflictDialog(false);
      setConflictData(null);
      handleClose();
    } catch (err) {
      onError(err.data?.message || "เกิดข้อผิดพลาดในการจัดสรรแบบบังคับ");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setConflictData(null);
    setShowConflictDialog(false);
    onClose();
  };

  const handleCancelConflict = () => {
    setShowConflictDialog(false);
    setConflictData(null);
    setAssignLoading(false);
  };

  // Format user display name
  const formatUserName = (user) => {
    if (!user) return "";
    const firstName = user.user_firstname || "";
    const lastName = user.user_lastname || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const nickname = user.user_nickname || user.username || "";

    if (fullName && nickname) {
      return `${fullName} (${nickname})`;
    }
    return fullName || nickname || user.username;
  };

  return (
    <>
      {/* Loading Backdrop */}
      <Backdrop
        open={assignLoading}
        sx={{ color: "#fff", zIndex: 9999, flexDirection: "column", gap: 2 }}
      >
        <CircularProgress color="inherit" />
        <Typography>กำลังจัดสรรลูกค้า... กรุณารอสักครู่</Typography>
      </Backdrop>

      {/* Main Assignment Dialog */}
      <Dialog
        open={open && !showConflictDialog}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="assign-dialog-title"
      >
        <DialogTitle id="assign-dialog-title">
          {getAssignLabel()}{" "}
          <Chip label={`${selectedIds.length} รายการ`} size="small" color="info" />
        </DialogTitle>
        <DialogContent>
          {/* Info about filtering */}
          {userSubRole && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {userSubRole === "HEAD_ONLINE" && "แสดงเฉพาะเซลล์ในทีม Online"}
              {userSubRole === "HEAD_OFFLINE" && "แสดงเฉพาะเซลล์ในทีม Offline"}
            </Alert>
          )}

          <Box mt={2}>
            <Autocomplete
              options={salesUsers}
              getOptionLabel={formatUserName}
              renderOption={(props, option) => (
                <li {...props} key={option.user_id}>
                  <Box>
                    <Typography variant="body2">{formatUserName(option)}</Typography>
                    {option.sub_roles?.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {option.sub_roles.map((sr) => sr.msr_name).join(", ")}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={getAssignLabel()}
                  required
                  inputProps={{
                    ...params.inputProps,
                    "aria-label": "เลือกเซลล์ผู้รับผิดชอบ",
                  }}
                />
              )}
              value={selectedUser}
              onChange={(e, val) => setSelectedUser(val)}
              isOptionEqualToValue={(option, value) => option.user_id === value?.user_id}
              loading={loadingUsers}
              disabled={assignLoading}
              noOptionsText="ไม่พบเซลล์"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} aria-label="ยกเลิกการจัดสรร">
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            disabled={!selectedUser || assignLoading}
            onClick={handleConfirmAssign}
            aria-label="ยืนยันการจัดสรรลูกค้า"
          >
            ยืนยันการจัดสรร
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <Dialog
        open={showConflictDialog}
        maxWidth="sm"
        fullWidth
        aria-labelledby="conflict-dialog-title"
      >
        <DialogTitle id="conflict-dialog-title">
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">ตรวจพบความขัดแย้ง</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>ลูกค้าบางรายถูกจัดสรรไปแล้ว:</Typography>
          {conflictData?.conflicts && (
            <List dense>
              {conflictData.conflicts.map((c, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={c.cus_name || `ลูกค้า ID: ${c.cus_id}`}
                    secondary={`เพิ่งถูกจัดสรรให้ ${c.allocated_to || "ผู้ใช้อื่น"} เมื่อสักครู่`}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Typography color="error" mt={2}>
            คุณต้องการยืนยันที่จะเปลี่ยนผู้รับผิดชอบหรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConflict} aria-label="ยกเลิก">
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleForceAssign}
            disabled={assignLoading}
            aria-label="ยืนยันการเปลี่ยนผู้รับผิดชอบแบบบังคับ"
          >
            ยืนยัน (Force)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

AssignDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedIds: PropTypes.array.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  userSubRole: PropTypes.string,
};

export default AssignDialog;
