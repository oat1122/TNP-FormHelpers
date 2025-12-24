import React from "react";
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
  Box,
  Alert,
} from "@mui/material";

import { useAssignDialog } from "../hooks";
import ConflictDialog from "./ConflictDialog";

/**
 * AssignDialog - Dialog for assigning customers to sales users
 * Now simplified using useAssignDialog hook
 */
const AssignDialog = ({ open, onClose, selectedIds, onSuccess, onError, userSubRole }) => {
  const {
    selectedUser,
    setSelectedUser,
    salesUsers,
    loadingUsers,
    handleConfirmAssign,
    handleForceAssign,
    assignLoading,
    conflictData,
    showConflictDialog,
    handleCancelConflict,
    getAssignLabel,
    formatUserName,
    resetState,
  } = useAssignDialog({ open, selectedIds, userSubRole, onSuccess, onError });

  const handleClose = () => {
    resetState();
    onClose();
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
      <ConflictDialog
        open={showConflictDialog}
        conflictData={conflictData}
        onCancel={handleCancelConflict}
        onForceAssign={handleForceAssign}
        isLoading={assignLoading}
      />
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
