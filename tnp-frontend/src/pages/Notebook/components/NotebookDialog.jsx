import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useState } from "react";
import {
  MdAssignment,
  MdBusiness,
  MdDonutLarge,
  MdEdit,
  MdEditDocument,
  MdEmail,
  MdExpandLess,
  MdExpandMore,
  MdHistory,
  MdNextPlan,
  MdNote,
  MdPerson,
  MdPhone,
  MdSave,
  MdSupervisorAccount,
} from "react-icons/md";

import { useGetAllUserQuery } from "../../../features/UserManagement/userManagementApi";
import DuplicatePhoneDialog from "../../Customer/components/Forms/DuplicatePhoneDialog";
import { useNotebookForm } from "../hooks/useNotebookForm";

// ─── Styled Components ───────────────────────────────────────────────────────

const StyledDialogTitle = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  padding: theme.spacing(2, 3),
  fontSize: "1.25rem",
  fontWeight: 600,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1.5),
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledPaper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(1),
  boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
  "&:hover": {
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  transition: "box-shadow 0.3s ease",
}));

// ─── FieldSection: history toggle (left) + edit button (right) + click-to-edit textarea ──

const getHistoriesForField = (histories, fieldName) =>
  (histories || []).filter((h) => h.new_values && fieldName in h.new_values);

const FieldSection = ({
  histories,
  fieldName,
  label,
  placeholder,
  value,
  onChange,
  inputProps,
  size,
  currentUser,
  isLoading,
}) => {
  const [open, setOpen] = useState(false);       // history list open/closed
  const [editing, setEditing] = useState(false); // textarea visible
  const [pendingEntries, setPendingEntries] = useState([]); // local optimistic entries

  const rows = getHistoriesForField(histories, fieldName);

  // Reset pending entries when histories update (after real save)
  const totalHistories = rows.length;

  const handleDone = () => {
    if (value && String(value).trim() !== "") {
      const now = new Date();
      const actor = currentUser?.username || currentUser?.user_nickname || "คุณ";
      setPendingEntries((prev) => [
        { _pending: true, val: String(value), actor, savedAt: now },
        ...prev,
      ]);
      setOpen(true); // auto-open history to show the new entry
    }
    setEditing(false);
  };

  // Clear pending entries that already appear in real histories (after RTK refetch)
  const allRows = [
    ...pendingEntries.map((p) => ({ ...p, _type: "pending" })),
    ...rows.map((r) => ({ ...r, _type: "saved" })),
  ];
  const hasRows = allRows.length > 0;

  const renderRow = (item, idx) => {
    const isPending = item._type === "pending";
    const val = isPending ? item.val : item.new_values?.[fieldName];
    const actor = isPending ? item.actor : (item.action_by?.username || item.action_by?.user_nickname || null);
    const savedAt = isPending ? item.savedAt : (item.created_at ? new Date(item.created_at) : null);
    const dateLabel = savedAt
      ? savedAt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
      : "-";
    const timeLabel = savedAt
      ? savedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
      : "";

    return (
      <Box
        key={isPending ? `p-${idx}` : (item.id ?? idx)}
        sx={{
          px: 1.5,
          py: 0.75,
          bgcolor: isPending ? "#fffbea" : (idx % 2 === 0 ? "#f7faff" : "#ffffff"),
          borderBottom: idx < allRows.length - 1 ? "1px solid" : "none",
          borderColor: isPending ? "warning.100" : "grey.100",
          borderLeft: isPending ? "3px solid" : "none",
          borderLeftColor: "warning.main",
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
          <Typography variant="caption" sx={{ color: isPending ? "warning.dark" : "primary.main", fontWeight: 600, fontSize: "0.68rem" }}>
            {dateLabel} {timeLabel}
          </Typography>
          {actor && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
              · {actor}
            </Typography>
          )}
          {isPending && (
            <Chip
              label="รอบันทึก"
              size="small"
              color="warning"
              sx={{ fontSize: "0.58rem", height: 16, ml: 0.5 }}
            />
          )}
        </Stack>
        <Typography
          variant="caption"
          sx={{ color: "text.primary", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, fontSize: "0.78rem", display: "block" }}
        >
          {val !== null && val !== undefined ? String(val) : "(ว่าง)"}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: open || editing ? 0.75 : 0.5 }}>
        {/* Left: history toggle */}
        {hasRows ? (
          <Button
            size="small"
            variant="text"
            onClick={() => setOpen((v) => !v)}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={12} color="inherit" /> : <MdHistory size={13} />}
            endIcon={open ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
            sx={{
              fontSize: "0.68rem",
              color: "primary.main",
              textTransform: "none",
              px: 0.75,
              py: 0.25,
              minHeight: 0,
              fontWeight: 600,
              "&:hover": { bgcolor: "primary.50" },
            }}
          >
            ประวัติ ({allRows.length})
          </Button>
        ) : (
          <Box />
        )}

        {/* Right: edit / done button — visible only after history is opened, or while editing */}
        {(open || editing) && (
          <Button
            size="small"
            variant={editing ? "contained" : "outlined"}
            color={editing ? "success" : "primary"}
            startIcon={editing ? <MdSave size={12} /> : <MdEdit size={12} />}
            onClick={editing ? handleDone : () => setEditing(true)}
            sx={{
              fontSize: "0.68rem",
              textTransform: "none",
              px: 1,
              py: 0.25,
              minHeight: 0,
              borderRadius: 5,
            }}
          >
            {editing ? "เสร็จ" : "แก้ไข"}
          </Button>
        )}
      </Stack>

      {/* History rows (collapsible) */}
      {hasRows && (
        <Collapse in={open}>
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "primary.200",
              borderRadius: 1.5,
              overflow: "hidden",
              mb: 0.75,
            }}
          >
            {allRows.map((item, idx) => renderRow(item, idx))}
          </Box>
        </Collapse>
      )}

      {/* TextField — only visible when editing */}
      <Collapse in={editing}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={10}
          label={label}
          name={fieldName}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          size={size || "medium"}
          InputProps={inputProps}
          sx={{ "& .MuiOutlinedInput-root": { alignItems: "flex-start" } }}
        />
      </Collapse>
    </Box>
  );
};


const HISTORY_FIELD_LABELS = {
  nb_additional_info: "รายละเอียด",
  nb_remarks: "หมายเหตุ (Internal Note)",
  nb_status: "สถานะ",
  nb_action: "Next Action",
  nb_customer_name: "ชื่อลูกค้า",
  nb_contact_person: "ผู้ติดต่อ",
  nb_contact_number: "เบอร์ติดต่อ",
  nb_email: "E-mail",
  nb_is_online: "ช่องทาง",
  nb_manage_by: "ผู้ดูแล",
};

const formatHistoryDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const HistoryItem = ({ history, index }) => {
  const [expanded, setExpanded] = useState(false);
  const changedKeys = Object.keys(history.new_values || {}).filter(
    (k) => !["updated_at", "created_at"].includes(k)
  );
  const actor = history.action_by?.username || history.action_by?.user_nickname || `User #${history.action_by}`;

  return (
    <Box
      sx={{
        position: "relative",
        pl: 3,
        pb: 2,
        "&::before": {
          content: '""',
          position: "absolute",
          left: "10px",
          top: "20px",
          bottom: 0,
          width: "2px",
          bgcolor: "grey.200",
          display: index === 0 ? "none" : "block",
        },
      }}
    >
      {/* Timeline dot */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: "6px",
          width: 20,
          height: 20,
          borderRadius: "50%",
          bgcolor: history.action === "created" ? "success.main" : "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          boxShadow: 2,
        }}
      >
        {history.action === "created" ? (
          <MdEditDocument size={10} color="white" />
        ) : (
          <MdEdit size={10} color="white" />
        )}
      </Box>

      <Box
        sx={{
          ml: 1.5,
          p: 1.5,
          bgcolor: "grey.50",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "grey.200",
          cursor: changedKeys.length > 0 ? "pointer" : "default",
          "&:hover": { bgcolor: changedKeys.length > 0 ? "grey.100" : "grey.50" },
          transition: "background 0.2s",
        }}
        onClick={() => changedKeys.length > 0 && setExpanded(!expanded)}
      >
        {/* Header Row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={history.action === "created" ? "สร้าง" : "แก้ไข"}
              size="small"
              color={history.action === "created" ? "success" : "primary"}
              sx={{ fontSize: "0.65rem", height: 20 }}
            />
            <Typography variant="caption" fontWeight={600} color="text.primary">
              {actor}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {formatHistoryDate(history.created_at)}
            </Typography>
            {changedKeys.length > 0 && (
              <Box sx={{ color: "text.secondary", display: "flex" }}>
                {expanded ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
              </Box>
            )}
          </Stack>
        </Stack>

        {/* Changed fields summary */}
        {changedKeys.length > 0 && !expanded && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            เปลี่ยน: {changedKeys.map((k) => HISTORY_FIELD_LABELS[k] || k).join(", ")}
          </Typography>
        )}

        {/* Expanded diff */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5 }}>
            {changedKeys.map((key) => {
              const oldVal = history.old_values?.[key];
              const newVal = history.new_values?.[key];
              const label = HISTORY_FIELD_LABELS[key] || key;
              return (
                <Box
                  key={key}
                  sx={{ mb: 1, p: 1, bgcolor: "background.paper", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
                >
                  <Typography variant="caption" fontWeight={700} color="primary.main" display="block" sx={{ mb: 0.5 }}>
                    {label}
                  </Typography>
                  {oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== "" && (
                    <Box sx={{ display: "flex", gap: 0.5, mb: 0.5, flexWrap: "wrap" }}>
                      <Typography variant="caption" sx={{ bgcolor: "#ffeaea", px: 1, py: 0.25, borderRadius: 1, color: "error.dark", fontStyle: "italic", maxWidth: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        เดิม: {String(oldVal)}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    <Typography variant="caption" sx={{ bgcolor: "#eaffea", px: 1, py: 0.25, borderRadius: 1, color: "success.dark", maxWidth: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      ใหม่: {newVal !== null && newVal !== undefined ? String(newVal) : "(ว่าง)"}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const NotebookDialog = () => {
  const theme = useTheme();
  const {
    // State
    dialogOpen,
    dialogMode,
    inputData,
    errors,
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    isSubmitting,
    currentUser,
    isAdmin,
    notebookDetail,
    notebookHistories,
    // Handlers
    handleClose,
    handleChange,
    handleOnlineToggle,
    handleSubmit,
    closeDuplicatePhoneDialog,
    checkPhoneDuplicate,
  } = useNotebookForm();

  // Fetch sales list for admin
  const { data: userData } = useGetAllUserQuery(
    { per_page: 1000 },
    {
      skip: !isAdmin && dialogMode !== "view",
    }
  );
  const salesList = userData?.data || [];

  const isEditMode = dialogMode === "edit";

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <StyledDialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {dialogMode === "create" ? <MdEditDocument size={24} /> : <MdEdit size={24} />}
          {dialogMode === "create" ? "จดบันทึกใหม่" : "แก้ไขบันทึก"}
        </Box>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FAFAFA" }}>
        <Grid container spacing={3}>
          {/* 1. Header Section: Sales Rep + Online Toggle */}
          <Grid item xs={12}>
            <StyledPaper>
              <Grid container spacing={3} alignItems="center">
                {/* Sale Rep Info */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isAdmin ? "transparent" : "primary.light",
                      color: isAdmin ? "inherit" : "primary.dark",
                      border: isAdmin ? "none" : "1px dashed",
                      borderColor: "primary.main",
                    }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: "white",
                        borderRadius: "50%",
                        boxShadow: 1,
                        display: "flex",
                      }}
                    >
                      <MdSupervisorAccount size={20} color={theme.palette.primary.main} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        ผู้ดูแล (Sales Rep)
                      </Typography>
                      {isAdmin ? (
                        <FormControl fullWidth size="small" variant="standard">
                          <Select
                            disableUnderline
                            name="nb_manage_by"
                            value={inputData.nb_manage_by || ""}
                            onChange={handleChange}
                            sx={{ fontWeight: 600, fontSize: "1rem" }}
                            displayEmpty
                          >
                            <MenuItem value="" disabled>
                              <em>เลือกเซลล์</em>
                            </MenuItem>
                            {salesList.map((user) => (
                              <MenuItem key={user.user_id} value={user.user_id}>
                                {user.username || user.user_nickname || `User ${user.user_id}`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="subtitle1" fontWeight={600}>
                          {currentUser.username || "คุณ"}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        display: "flex",
                        bgcolor: "grey.200",
                        borderRadius: 10,
                        p: 0.25,
                      }}
                    >
                      <Button
                        size="small"
                        variant={inputData.nb_is_online ? "contained" : "text"}
                        color="success"
                        sx={{
                          borderRadius: 10,
                          px: 1,
                          py: 0.25,
                          minWidth: 0,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap",
                          boxShadow: inputData.nb_is_online ? 2 : 0,
                          backgroundColor: inputData.nb_is_online ? "success.main" : "transparent",
                          color: inputData.nb_is_online ? "white" : "text.secondary",
                          "&:hover": {
                            backgroundColor: inputData.nb_is_online ? "success.dark" : "grey.300",
                          },
                        }}
                        onClick={() => handleOnlineToggle(true)}
                      >
                        Online
                      </Button>
                      <Button
                        size="small"
                        variant={!inputData.nb_is_online ? "contained" : "text"}
                        color="warning"
                        sx={{
                          borderRadius: 10,
                          px: 1,
                          py: 0.25,
                          minWidth: 0,
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap",
                          boxShadow: !inputData.nb_is_online ? 2 : 0,
                          backgroundColor: !inputData.nb_is_online ? "warning.main" : "transparent",
                          color: !inputData.nb_is_online ? "white" : "text.secondary",
                          "&:hover": {
                            backgroundColor: !inputData.nb_is_online ? "warning.dark" : "grey.300",
                          },
                        }}
                        onClick={() => handleOnlineToggle(false)}
                      >
                        On-site
                      </Button>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>

          {/* 2. Customer Information */}
          <Grid item xs={12}>
            <SectionTitle>
              <MdBusiness style={{ fontSize: "1.1rem" }} />
              ข้อมูลลูกค้า
            </SectionTitle>
            <StyledPaper>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ชื่อลูกค้า/ชื่อย่อ(เพื่อค้นหา) "
                    name="nb_customer_name"
                    value={inputData.nb_customer_name || ""}
                    onChange={handleChange}
                    error={!!errors.nb_customer_name}
                    helperText={errors.nb_customer_name}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdBusiness color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="ชื่อลูกค้า"
                    name="nb_contact_person"
                    value={inputData.nb_contact_person || ""}
                    onChange={handleChange}
                    placeholder="ระบุชื่อลูกค้า หรือบริษัท"
                    error={!!errors.nb_contact_person}
                    helperText={errors.nb_contact_person}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdPerson color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="เบอร์ติดต่อ"
                    name="nb_contact_number"
                    value={inputData.nb_contact_number || ""}
                    onChange={handleChange}
                    error={!!errors.nb_contact_number}
                    helperText={errors.nb_contact_number}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdPhone color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                    onBlur={(e) => checkPhoneDuplicate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    name="nb_email"
                    value={inputData.nb_email || ""}
                    onChange={handleChange}
                    error={!!errors.nb_email}
                    helperText={errors.nb_email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdEmail color={theme.palette.action.active} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>

          {/* 3. Status & Tracking */}
          <Grid item xs={12}>
            <SectionTitle>
              <MdAssignment style={{ fontSize: "1.1rem" }} />
              สถานะและการติดตาม
            </SectionTitle>
            <StyledPaper sx={{ borderLeft: `6px solid ${theme.palette.info.main}` }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="สถานะปัจจุบัน"
                    name="nb_status"
                    value={inputData.nb_status || ""}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdDonutLarge color={theme.palette.info.main} />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="พิจารณา">พิจารณา</MenuItem>
                    <MenuItem value="ได้งาน">ได้งาน</MenuItem>
                    <MenuItem value="หลุด">หลุด</MenuItem>
                    <MenuItem value="ไม่ได้งาน">ไม่ได้งาน</MenuItem>
                    <MenuItem value="ยังไม่แผนทำ">ยังไม่แผนทำ</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="สิ่งที่ต้องทำถัดไป (Next Action)"
                    name="nb_action"
                    value={inputData.nb_action || ""}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdNextPlan color={theme.palette.warning.main} />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="โทร">โทร</MenuItem>
                    <MenuItem value="ส่งเมล/Company Profile">ส่งเมล/Company Profile</MenuItem>
                    <MenuItem value="ลูกค้ามาพบ">ลูกค้ามาพบ</MenuItem>
                    <MenuItem value="ส่งงานมา">ส่งงานมา</MenuItem>
                    <MenuItem value="ได้เข้าพบ">ได้เข้าพบ</MenuItem>
                  </TextField>
                </Grid>

                {/* 4. Details & Remarks — Auto-Expanding */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  {isEditMode ? (
                    <FieldSection
                      histories={notebookHistories}
                      fieldName="nb_additional_info"
                      label="รายละเอียด / ข้อมูลเพิ่มเติม"
                      placeholder="บันทึกรายละเอียดการพูดคุย หรือสิ่งที่ลูกค้าต้องการ..."
                      value={inputData.nb_additional_info}
                      onChange={handleChange}
                      currentUser={currentUser}
                      isLoading={isSubmitting}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={10}
                      label="รายละเอียด / ข้อมูลเพิ่มเติม"
                      name="nb_additional_info"
                      value={inputData.nb_additional_info || ""}
                      onChange={handleChange}
                      placeholder="บันทึกรายละเอียดการพูดคุย หรือสิ่งที่ลูกค้าต้องการ..."
                      variant="outlined"
                      sx={{ "& .MuiOutlinedInput-root": { alignItems: "flex-start" } }}
                    />
                  )}
                </Grid>

                <Grid item xs={12}>
                  {isEditMode ? (
                    <FieldSection
                      histories={notebookHistories}
                      fieldName="nb_remarks"
                      label="หมายเหตุ (Internal Note)"
                      placeholder="บันทึกหมายเหตุภายใน..."
                      value={inputData.nb_remarks}
                      onChange={handleChange}
                      size="small"
                      currentUser={currentUser}
                      isLoading={isSubmitting}
                      inputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.2 }}>
                            <MdNote color={theme.palette.text.secondary} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      maxRows={10}
                      label="หมายเหตุ (Internal Note)"
                      name="nb_remarks"
                      value={inputData.nb_remarks || ""}
                      onChange={handleChange}
                      placeholder="บันทึกหมายเหตุภายใน..."
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.2 }}>
                            <MdNote color={theme.palette.text.secondary} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { alignItems: "flex-start" } }}
                    />
                  )}
                </Grid>
              </Grid>
            </StyledPaper>
          </Grid>


        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: "#FAFAFA", borderTop: "1px solid #eee" }}>
        <Button onClick={handleClose} color="inherit" size="large" sx={{ mr: 2 }}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<MdSave />}
          disabled={isSubmitting}
          size="large"
          sx={{
            px: 4,
            borderRadius: 8,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </DialogActions>

      <DuplicatePhoneDialog
        open={duplicatePhoneDialogOpen}
        onClose={closeDuplicatePhoneDialog}
        duplicateData={duplicatePhoneData}
      />
    </Dialog>
  );
};

export default NotebookDialog;
