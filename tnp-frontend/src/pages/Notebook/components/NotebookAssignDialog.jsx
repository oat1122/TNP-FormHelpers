import PropTypes from "prop-types";
import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useNotebookAssignDialog } from "../hooks/useNotebookAssignDialog";

const NotebookAssignDialog = ({ open, notebooks, currentUser, onClose, onSuccess, onError }) => {
  const selectedCount = notebooks?.length || 0;
  const previewNotebooks = (notebooks || []).slice(0, 3);

  const {
    selectedUser,
    setSelectedUser,
    salesUsers,
    loadingUsers,
    assignLoading,
    isHeadOffline,
    isSupportSales,
    handleConfirmAssign,
    formatUserName,
    resetState,
  } = useNotebookAssignDialog({
    open,
    notebooks,
    currentUser,
    onSuccess,
    onError,
  });

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  return (
    <>
      <Backdrop open={assignLoading} sx={{ color: "#fff", zIndex: 9999, flexDirection: "column", gap: 2 }}>
        <CircularProgress color="inherit" />
        <Typography>กำลังมอบหมาย Notebook {selectedCount > 1 ? `${selectedCount} รายการ` : ""}...</Typography>
      </Backdrop>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          มอบหมาย Notebook
          <Chip label={`${selectedCount} รายการ`} size="small" color="info" sx={{ ml: 1 }} />
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {isSupportSales
              ? "แสดงเซลส์ทีม Offline และหัวหน้าทีม Offline"
              : "แสดงเฉพาะเซลส์ทีม Offline"}
            {isHeadOffline ? " รวมถึงบัญชี HEAD_OFFLINE ของคุณ" : ""}
          </Alert>

          {selectedCount > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                รายการที่เลือก
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {previewNotebooks.map((notebook) => (
                  <Chip
                    key={notebook.id}
                    label={notebook.nb_customer_name || `Notebook #${notebook.id}`}
                    size="small"
                    variant="outlined"
                    sx={{ maxWidth: 240 }}
                  />
                ))}
                {selectedCount > previewNotebooks.length ? (
                  <Chip
                    label={`และอีก ${selectedCount - previewNotebooks.length} รายการ`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                ) : null}
              </Stack>
            </Box>
          ) : null}

          <Alert severity="warning" sx={{ mb: 2 }}>
            เมื่อยืนยัน ระบบจะมอบหมาย Notebook ทั้งหมดที่เลือกในครั้งเดียว
          </Alert>

          <Autocomplete
            options={salesUsers}
            getOptionLabel={formatUserName}
            value={selectedUser}
            onChange={(event, value) => setSelectedUser(value)}
            isOptionEqualToValue={(option, value) => option.user_id === value?.user_id}
            loading={loadingUsers}
            disabled={assignLoading}
            noOptionsText="ไม่พบผู้รับมอบหมาย"
            renderOption={(props, option) => (
              <li {...props} key={option.user_id}>
                <Box>
                  <Typography variant="body2">{formatUserName(option)}</Typography>
                  {option.sub_roles?.length > 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      {option.sub_roles.map((subRole) => subRole.msr_name).join(", ")}
                    </Typography>
                  ) : null}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="เลือกผู้รับมอบหมาย"
                required
                inputProps={{
                  ...params.inputProps,
                  "aria-label": "เลือกผู้รับมอบหมาย Notebook",
                }}
              />
            )}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button
            variant="contained"
            disabled={!selectedUser || assignLoading}
            onClick={handleConfirmAssign}
          >
            มอบหมาย {selectedCount > 1 ? `${selectedCount} รายการ` : ""}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

NotebookAssignDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  notebooks: PropTypes.arrayOf(PropTypes.object),
  currentUser: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default NotebookAssignDialog;
