import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { MdAdd, MdEdit, MdDelete, MdSave, MdClose, MdSearch, MdHistory, MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router-dom";

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
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                    {log.sspl_old_phone || "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
                    {log.sspl_new_phone || "-"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 13 }}>
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
 * SellerList - Full-page seller management
 */
const SellerList = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = user?.role === "admin";

  const [searchText, setSearchText] = useState("");

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

  // Filter sellers by search text (client-side)
  const filteredSellers = sellers.filter((s) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      (s.ss_company_name || "").toLowerCase().includes(q) ||
      (s.ss_tax_id || "").toLowerCase().includes(q) ||
      (s.ss_phone || "").toLowerCase().includes(q) ||
      (s.ss_contact_person || "").toLowerCase().includes(q) ||
      (s.ss_country || "").toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => navigate("/")} sx={{ color: PRIMARY_RED }}>
            <MdArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontFamily: "Kanit", fontWeight: 600, color: PRIMARY_RED }}>
            Seller List (ผู้ขาย)
          </Typography>
          <Chip
            label={`${sellers.length} Seller`}
            size="small"
            sx={{ fontFamily: "Kanit", ml: 1 }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<MdAdd />}
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
          sx={{ fontFamily: "Kanit", bgcolor: PRIMARY_RED }}
        >
          เพิ่ม Seller
        </Button>
      </Box>

      {/* Add Form */}
      {showAddForm && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: "#fafafa", borderColor: PRIMARY_RED }}>
          <Typography variant="subtitle1" sx={{ fontFamily: "Kanit", fontWeight: 600, mb: 2 }}>
            เพิ่ม Seller ใหม่
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                size="small"
                label="ชื่อบริษัท *"
                value={newSeller.ss_company_name}
                onChange={(e) => setNewSeller({ ...newSeller, ss_company_name: e.target.value })}
                fullWidth
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                size="small"
                label="เลขผู้เสียภาษี"
                value={newSeller.ss_tax_id}
                onChange={(e) => setNewSeller({ ...newSeller, ss_tax_id: e.target.value })}
                fullWidth
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                size="small"
                label="เบอร์โทร"
                value={newSeller.ss_phone}
                onChange={(e) => setNewSeller({ ...newSeller, ss_phone: e.target.value })}
                fullWidth
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                size="small"
                label="ประเทศ"
                value={newSeller.ss_country}
                onChange={(e) => setNewSeller({ ...newSeller, ss_country: e.target.value })}
                fullWidth
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                size="small"
                label="ผู้ติดต่อ"
                value={newSeller.ss_contact_person}
                onChange={(e) => setNewSeller({ ...newSeller, ss_contact_person: e.target.value })}
                fullWidth
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                size="small"
                label="ที่อยู่"
                value={newSeller.ss_address}
                onChange={(e) => setNewSeller({ ...newSeller, ss_address: e.target.value })}
                fullWidth
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                size="small"
                label="หมายเหตุ"
                value={newSeller.ss_remark}
                onChange={(e) => setNewSeller({ ...newSeller, ss_remark: e.target.value })}
                fullWidth
                InputProps={{ style: { fontFamily: "Kanit" } }}
                InputLabelProps={{ style: { fontFamily: "Kanit" } }}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={adding ? <CircularProgress size={14} /> : <MdSave />}
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

      {/* Search */}
      <TextField
        size="small"
        placeholder="ค้นหาชื่อบริษัท, เลขภาษี, เบอร์โทร, ผู้ติดต่อ..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{ mb: 2, width: { xs: "100%", sm: 400 } }}
        InputProps={{
          style: { fontFamily: "Kanit" },
          startAdornment: (
            <InputAdornment position="start">
              <MdSearch />
            </InputAdornment>
          ),
        }}
      />

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: PRIMARY_RED }} />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ชื่อบริษัท</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>เลขผู้เสียภาษี</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>เบอร์โทร</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ประเทศ</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ผู้ติดต่อ</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>ที่อยู่</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }}>หมายเหตุ</TableCell>
                <TableCell sx={{ fontFamily: "Kanit", fontWeight: 600 }} align="center">
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSellers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ fontFamily: "Kanit", textAlign: "center", py: 4 }}>
                    {searchText ? "ไม่พบ Seller ที่ตรงกับคำค้นหา" : "ยังไม่มี Seller — กดปุ่ม \"เพิ่ม Seller\" เพื่อเริ่มต้น"}
                  </TableCell>
                </TableRow>
              )}
              {filteredSellers.map((seller) => (
                <TableRow key={seller.ss_id} hover>
                  {/* Company Name */}
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 14, fontWeight: 500 }}>
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
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 13, color: "text.secondary" }}>
                    {editingId === seller.ss_id ? (
                      <TextField
                        size="small"
                        value={editForm.ss_tax_id}
                        onChange={(e) => setEditForm({ ...editForm, ss_tax_id: e.target.value })}
                        sx={{ width: 150 }}
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
                        sx={{ width: 140 }}
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
                        sx={{ width: 130 }}
                        InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                      />
                    ) : (
                      seller.ss_contact_person || "-"
                    )}
                  </TableCell>
                  {/* Address */}
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 12, color: "text.secondary", maxWidth: 200 }}>
                    {editingId === seller.ss_id ? (
                      <TextField
                        size="small"
                        value={editForm.ss_address}
                        onChange={(e) => setEditForm({ ...editForm, ss_address: e.target.value })}
                        fullWidth
                        InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                      />
                    ) : (
                      <Tooltip title={seller.ss_address || ""} arrow>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                          {seller.ss_address || "-"}
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                  {/* Remark */}
                  <TableCell sx={{ fontFamily: "Kanit", fontSize: 12, color: "text.secondary", maxWidth: 150 }}>
                    {editingId === seller.ss_id ? (
                      <TextField
                        size="small"
                        value={editForm.ss_remark}
                        onChange={(e) => setEditForm({ ...editForm, ss_remark: e.target.value })}
                        fullWidth
                        InputProps={{ style: { fontFamily: "Kanit", fontSize: 13 } }}
                      />
                    ) : (
                      <Tooltip title={seller.ss_remark || ""} arrow>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                          {seller.ss_remark || "-"}
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                  {/* Actions */}
                  <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
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
                          <Tooltip title="ประวัติเบอร์โทร">
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

      {/* Count */}
      {!isLoading && (
        <Typography variant="body2" sx={{ fontFamily: "Kanit", mt: 1.5, color: "text.secondary" }}>
          แสดง {filteredSellers.length} จาก {sellers.length} Seller
        </Typography>
      )}

      {/* Phone Log Dialog */}
      <PhoneLogDialog
        open={!!phoneLogSellerId}
        onClose={handleClosePhoneLogs}
        logs={phoneLogs}
        loading={phoneLogsLoading}
        sellerName={phoneLogSeller?.ss_company_name || ""}
      />
    </Box>
  );
};

export default SellerList;
