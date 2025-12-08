import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import axios from "axios";

import { useAssignCustomersMutation } from "../../../features/Customer/customerApi";

/**
 * AssignDialog - Dialog for assigning customers to sales users with conflict handling
 */
const AssignDialog = ({ open, onClose, selectedIds, onSuccess, onError }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  const [assignCustomers] = useAssignCustomersMutation();

  // Fetch sales users
  useEffect(() => {
    if (open) {
      fetchSalesUsers();
    }
  }, [open]);

  const fetchSalesUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/get-users-by-role?role=sale,admin,manager`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSalesUsers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch sales users", error);
      onError("ไม่สามารถโหลดรายชื่อเซลล์ได้");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedUser) return;

    setAssignLoading(true);
    try {
      const result = await assignCustomers({
        customer_ids: selectedIds,
        sales_user_id: selectedUser.user_uuid,
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
        sales_user_id: selectedUser.user_uuid,
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
          เลือกเซลล์ผู้รับผิดชอบ{" "}
          <Chip label={`${selectedIds.length} รายการ`} size="small" color="info" />
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Autocomplete
              options={salesUsers}
              getOptionLabel={(opt) => opt.nickname || opt.username}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="เลือกเซลล์"
                  required
                  inputProps={{
                    ...params.inputProps,
                    "aria-label": "เลือกเซลล์ผู้รับผิดชอบ",
                  }}
                />
              )}
              value={selectedUser}
              onChange={(e, val) => setSelectedUser(val)}
              isOptionEqualToValue={(option, value) => option.user_uuid === value.user_uuid}
              loading={loadingUsers}
              disabled={assignLoading}
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

export default AssignDialog;
