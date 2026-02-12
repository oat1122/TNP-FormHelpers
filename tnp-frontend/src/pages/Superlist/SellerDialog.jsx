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
  Grid,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { MdClose, MdEdit, MdSave, MdDelete, MdAdd, MdHistory } from "react-icons/md";

import { useSellerManagement } from "./hooks";
import { PRIMARY_RED } from "./utils";

/**
 * PhoneLogDialog - Sub-dialog showing phone change history (admin only)
 */
const PhoneLogDialog = ({ open, onClose, logs, loading, sellerName }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
      ประวัติเบอร์โทร — {sellerName}
      <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
        <MdClose />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>
      {loading ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : logs.length === 0 ? (
        <Typography sx={{ fontFamily: "Kanit", textAlign: "center", py: 3, color: "text.secondary" }}>
          ไม่มีประวัติ
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>วันที่</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>เบอร์เก่า</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>เบอร์ใหม่</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ผู้เปลี่ยน</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.sspl_id}>
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 12 }}>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 12 }}>
                    {log.sspl_old_phone || "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 12 }}>
                    {log.sspl_new_phone || "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 12 }}>
                    {log.changed_by_user?.user_nickname || log.changed_by_user?.username || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} sx={{ fontFamily: "Kanit" }}>
        ปิด
      </Button>
    </DialogActions>
  </Dialog>
);

/**
 * SellerDialog - Dialog for managing sellers (CRUD)
 * Shows phone log history button for admin users
 */
const SellerDialog = ({ open, onClose }) => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user?.role === "admin";

  const {
    sellers,
    isLoading,
    newSeller,
    setNewSeller,
    showAddForm,
    setShowAddForm,
    adding,
    handleAdd,
    editingId,
    editForm,
    setEditForm,
    updating,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDelete,
    phoneLogSellerId,
    phoneLogs,
    phoneLogsLoading,
    handleOpenPhoneLogs,
    handleClosePhoneLogs,
  } = useSellerManagement();

  const phoneLogSeller = sellers.find((s) => s.ss_id === phoneLogSellerId);

  const handleClose = () => {
    handleCancelEdit();
    setShowAddForm(false);
    setNewSeller({
      ss_company_name: "",
      ss_tax_id: "",
      ss_phone: "",
      ss_country: "",
      ss_address: "",
      ss_contact_person: "",
      ss_remark: "",
    });
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { fontFamily: "Kanit" } }}>
        <DialogTitle sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
          จัดการผู้ขาย (Seller)
          <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
            <MdClose />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Add Button / Add Form */}
          {!showAddForm ? (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<MdAdd />}
                onClick={() => setShowAddForm(true)}
                sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
              >
                เพิ่ม Seller
              </Button>
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#fafafa", borderColor: PRIMARY_RED }}>
              <Typography variant="subtitle2" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 1.5 }}>
                เพิ่ม Seller ใหม่
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    size="small"
                    label="ชื่อบริษัท *"
                    value={newSeller.ss_company_name}
                    onChange={(e) => setNewSeller({ ...newSeller, ss_company_name: e.target.value })}
                    fullWidth
                    InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                    InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    size="small"
                    label="เลขผู้เสียภาษี"
                    value={newSeller.ss_tax_id}
                    onChange={(e) => setNewSeller({ ...newSeller, ss_tax_id: e.target.value })}
                    fullWidth
                    InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                    InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    size="small"
                    label="เบอร์โทร"
                    value={newSeller.ss_phone}
                    onChange={(e) => setNewSeller({ ...newSeller, ss_phone: e.target.value })}
                    fullWidth
                    InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                    InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    size="small"
                    label="ประเทศ"
                    value={newSeller.ss_country}
                    onChange={(e) => setNewSeller({ ...newSeller, ss_country: e.target.value })}
                    fullWidth
                    InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                    InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    size="small"
                    label="ผู้ติดต่อ"
                    value={newSeller.ss_contact_person}
                    onChange={(e) => setNewSeller({ ...newSeller, ss_contact_person: e.target.value })}
                    fullWidth
                    InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                    InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    size="small"
                    label="ที่อยู่"
                    value={newSeller.ss_address}
                    onChange={(e) => setNewSeller({ ...newSeller, ss_address: e.target.value })}
                    fullWidth
                    InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                    InputLabelProps={{ style: { fontFamily: "Kanit" } }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={adding ? <CircularProgress size={14} /> : <MdAdd />}
                  onClick={handleAdd}
                  disabled={adding}
                  sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
                >
                  บันทึก
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MdClose />}
                  onClick={() => setShowAddForm(false)}
                  sx={{ fontFamily: "Kanit" }}
                >
                  ยกเลิก
                </Button>
              </Box>
            </Paper>
          )}

          {/* Sellers Table */}
          {isLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ชื่อบริษัท</TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>เลขภาษี</TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>เบอร์โทร</TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ประเทศ</TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ผู้ติดต่อ</TableCell>
                    <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }} align="center">
                      จัดการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sellers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ fontFamily: "Kanit", textAlign: "center", py: 3 }}>
                        ยังไม่มี Seller
                      </TableCell>
                    </TableRow>
                  )}
                  {sellers.map((seller) => (
                    <TableRow key={seller.ss_id}>
                      {/* Company Name */}
                      <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                        {editingId === seller.ss_id ? (
                          <TextField
                            size="small"
                            value={editForm.ss_company_name}
                            onChange={(e) => setEditForm({ ...editForm, ss_company_name: e.target.value })}
                            fullWidth
                            InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          />
                        ) : (
                          seller.ss_company_name
                        )}
                      </TableCell>
                      {/* Tax ID */}
                      <TableCell sx={{ fontFamily: "Kanit", fontSize: 12, color: "text.secondary" }}>
                        {editingId === seller.ss_id ? (
                          <TextField
                            size="small"
                            value={editForm.ss_tax_id}
                            onChange={(e) => setEditForm({ ...editForm, ss_tax_id: e.target.value })}
                            sx={{ width: 140 }}
                            InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          />
                        ) : (
                          seller.ss_tax_id || "-"
                        )}
                      </TableCell>
                      {/* Phone */}
                      <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                        {editingId === seller.ss_id ? (
                          <TextField
                            size="small"
                            value={editForm.ss_phone}
                            onChange={(e) => setEditForm({ ...editForm, ss_phone: e.target.value })}
                            sx={{ width: 130 }}
                            InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          />
                        ) : (
                          seller.ss_phone || "-"
                        )}
                      </TableCell>
                      {/* Country */}
                      <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                        {editingId === seller.ss_id ? (
                          <TextField
                            size="small"
                            value={editForm.ss_country}
                            onChange={(e) => setEditForm({ ...editForm, ss_country: e.target.value })}
                            sx={{ width: 100 }}
                            InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          />
                        ) : (
                          seller.ss_country || "-"
                        )}
                      </TableCell>
                      {/* Contact Person */}
                      <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                        {editingId === seller.ss_id ? (
                          <TextField
                            size="small"
                            value={editForm.ss_contact_person}
                            onChange={(e) => setEditForm({ ...editForm, ss_contact_person: e.target.value })}
                            sx={{ width: 120 }}
                            InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                          />
                        ) : (
                          seller.ss_contact_person || "-"
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell align="center">
                        {editingId === seller.ss_id ? (
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                            <Tooltip title="บันทึก">
                              <IconButton size="small" onClick={handleSaveEdit} sx={{ color: "success.main" }}>
                                {updating ? <CircularProgress size={16} /> : <MdSave />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ยกเลิก">
                              <IconButton size="small" onClick={handleCancelEdit}>
                                <MdClose />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                            <Tooltip title="แก้ไข">
                              <IconButton size="small" onClick={() => handleStartEdit(seller)}>
                                <MdEdit />
                              </IconButton>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip title="ประวัติเบอร์">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPhoneLogs(seller.ss_id)}
                                  sx={{ color: "info.main" }}
                                >
                                  <MdHistory />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="ลบ">
                              <IconButton size="small" onClick={() => handleDelete(seller)} sx={{ color: PRIMARY_RED }}>
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

          {/* Updated info */}
          <Typography variant="caption" sx={{ fontFamily: "Kanit", mt: 1, display: "block", color: "text.secondary" }}>
            ทั้งหมด {sellers.length} Seller
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} sx={{ fontFamily: "Kanit" }}>
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* Phone Log Sub-Dialog */}
      <PhoneLogDialog
        open={!!phoneLogSellerId}
        onClose={handleClosePhoneLogs}
        logs={phoneLogs}
        loading={phoneLogsLoading}
        sellerName={phoneLogSeller?.ss_company_name || ""}
      />
    </>
  );
};

export default SellerDialog;
