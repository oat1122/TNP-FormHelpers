import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Fab,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdAssignment,
  MdBusiness,
  MdEdit,
  MdNote,
  MdRemoveRedEye,
  MdSave,
  MdSupervisorAccount,
} from "react-icons/md";

import NotebookHistoryTimeline from "./NotebookHistoryTimeline";
import NotebookNoteField from "./NotebookNoteField";
import NotebookQuickActions from "./NotebookQuickActions";
import NotebookSummaryBar from "./NotebookSummaryBar";
import { useGetAllUserQuery } from "../../../features/UserManagement/userManagementApi";
import DuplicatePhoneDialog from "../../Customer/components/Forms/DuplicatePhoneDialog";
import { useNotebookForm } from "../hooks/useNotebookForm";
import {
  NOTEBOOK_STATUS_OPTIONS,
  getNotebookActionLabel,
  getNotebookSourceMeta,
  getNotebookStatusLabel,
  getNotebookStatusOption,
} from "../utils/notebookDialogConfig";

const SectionCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.25),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: "1rem",
  fontWeight: 700,
  marginBottom: theme.spacing(0.5),
}));

const SourceToggleButton = styled(ToggleButton)(({ theme }) => ({
  textTransform: "none",
  borderRadius: 999,
  paddingInline: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
}));

const createSyntheticEvent = (name, value) => ({
  target: {
    name,
    value,
    type: "text",
  },
});

const getUserDisplayName = (user) =>
  user?.username ||
  user?.user_nickname ||
  [user?.user_firstname, user?.user_lastname].filter(Boolean).join(" ") ||
  "";

const getThaiSourceLabel = (label) => {
  if (label === "Online") {
    return "ออนไลน์";
  }

  if (label === "On-site") {
    return "ออนไซต์";
  }

  return label;
};

const NotebookDialog = ({ currentUser = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const noteInputRef = useRef(null);
  const workflowSectionRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingDraftMap, setPendingDraftMap] = useState({});

  const {
    dialogOpen,
    dialogMode,
    dialogFocusTarget,
    recordKey,
    draft,
    errors,
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    isSubmitting,
    isAdmin,
    notebookHistories,
    isNotebookDetailFetching,
    handleClose,
    handleChange,
    handleBlur,
    handleOnlineToggle,
    handleSubmit,
    closeDuplicatePhoneDialog,
    checkPhoneDuplicate,
  } = useNotebookForm({ currentUser });

  const { data: userData } = useGetAllUserQuery(
    { per_page: 1000 },
    {
      skip: !isAdmin,
    }
  );

  const salesList = userData?.data || [];
  const isEditMode = dialogMode === "edit";
  const isViewMode = dialogMode === "view";
  const isCreateMode = dialogMode === "create";
  const historyLoading = !isCreateMode && isNotebookDetailFetching;
  const summaryTitle = draft.nb_customer_name?.trim() || "บันทึกการขายใหม่";
  const statusMeta = getNotebookStatusOption(draft.nb_status);
  const sourceMeta = getNotebookSourceMeta(Boolean(draft.nb_is_online));
  const selectedSalesOwner = salesList.find(
    (user) => String(user.user_id) === String(draft.nb_manage_by)
  );
  const linkedSalesOwner = draft.manage_by_user;
  const resolvedSalesOwner = selectedSalesOwner || linkedSalesOwner;
  const isCentralQueueItem = draft.nb_workflow === "lead_queue" && !draft.nb_manage_by;
  const salesOwnerLabel = isAdmin
    ? getUserDisplayName(resolvedSalesOwner) || "ยังไม่ได้ระบุผู้ดูแล"
    : isCentralQueueItem
      ? "คิวกลาง"
      : getUserDisplayName(linkedSalesOwner) ||
        getUserDisplayName(currentUser) ||
        (draft.nb_manage_by ? `ผู้ใช้ ${draft.nb_manage_by}` : "ผู้ดูแลการขาย");
  const resetKey = `${recordKey}-${historyLoading ? "loading" : "ready"}`;

  useEffect(() => {
    setShowHistory(false);
    setPendingDraftMap({});
  }, [dialogOpen, resetKey]);

  useEffect(() => {
    if (!dialogOpen || dialogFocusTarget !== "workflow") {
      return;
    }

    const handle = requestAnimationFrame(() => {
      workflowSectionRef.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
      workflowSectionRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(handle);
    };
  }, [dialogFocusTarget, dialogOpen, resetKey]);

  const pendingDrafts = useMemo(
    () =>
      Object.values(pendingDraftMap)
        .filter(Boolean)
        .map((draftItem) => ({
          ...draftItem,
          actor: currentUser?.username || currentUser?.user_nickname || "ผู้ใช้ปัจจุบัน",
        })),
    [currentUser, pendingDraftMap]
  );
  const visibleHistories = useMemo(
    () => notebookHistories.filter((history) => history?.action !== "created"),
    [notebookHistories]
  );

  const setFieldValue = (name, value) => {
    handleChange(createSyntheticEvent(name, value));
  };

  const handleActionChange = (value) => {
    if (isViewMode) {
      return;
    }

    setFieldValue("nb_action", value);
    requestAnimationFrame(() => noteInputRef.current?.focus());
  };

  const handleStatusChange = (_, value) => {
    if (!value) {
      return;
    }

    setFieldValue("nb_status", value);
  };

  const handlePendingDraftChange = (fieldName, draftItem) => {
    setPendingDraftMap((previous) => {
      const next = { ...previous };

      if (!draftItem) {
        delete next[fieldName];
        return next;
      }

      next[fieldName] = draftItem;
      return next;
    });
  };

  const modeLabel = isViewMode ? "ดูบันทึก" : isEditMode ? "แก้ไขบันทึก" : "บันทึกการขายใหม่";
  const closeButtonLabel = isViewMode ? "ปิด" : "ยกเลิก";
  const noteDescription = isEditMode
    ? "เพิ่มอัปเดตล่าสุดที่ใช้คุยกับลูกค้าที่นี่ โดยบันทึกเดิมจะยังแสดงอยู่ในประวัติกิจกรรม"
    : "บันทึกรายละเอียดที่คุยกับลูกค้า ประเด็นสำคัญ และข้อตกลงสำหรับการติดตามครั้งถัดไป";
  const internalNoteDescription = isEditMode
    ? "เพิ่มอัปเดตภายในล่าสุดได้ที่นี่ โดยไม่ลบบันทึกก่อนหน้า"
    : "ใช้สำหรับจดเตือน ข้อมูลราคา หรือหมายเหตุภายในทีม";

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          overflow: "hidden",
          bgcolor: "grey.50",
          maxHeight: { xs: "100%", sm: "92vh" },
        },
      }}
    >
      <DialogContent
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 11, sm: 3 },
          bgcolor: "grey.50",
        }}
      >
        <Stack spacing={2.25}>
          <NotebookSummaryBar
            title={summaryTitle}
            modeLabel={modeLabel}
            statusMeta={statusMeta}
            actionLabel={getNotebookActionLabel(draft.nb_action)}
            salesOwnerLabel={salesOwnerLabel}
            sourceMeta={sourceMeta}
            onClose={handleClose}
          />

          <Box ref={workflowSectionRef} tabIndex={-1} sx={{ outline: "none" }}>
            <NotebookQuickActions
              value={draft.nb_action}
              onChange={handleActionChange}
              readOnly={isViewMode}
            />
          </Box>

          <Grid container spacing={2.25}>
            <Grid item xs={12} md={7}>
              <Stack spacing={2.25}>
                <SectionCard>
                  <SectionHeading>
                    <MdAssignment />
                    สถานะการติดตาม
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    อัปเดตสถานะล่าสุดได้ทันทีโดยไม่ต้องเปิดเมนูเพิ่ม
                  </Typography>

                  <ToggleButtonGroup
                    exclusive
                    value={draft.nb_status || null}
                    onChange={handleStatusChange}
                    disabled={isViewMode}
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
                    {NOTEBOOK_STATUS_OPTIONS.map((option) => (
                      <ToggleButton
                        key={option.value}
                        value={option.value}
                        sx={{
                          borderRadius: 999,
                          border: "1px solid",
                          borderColor: "divider",
                          textTransform: "none",
                          px: 1.5,
                          py: 0.75,
                        }}
                      >
                        {option.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
                    <Chip
                      color={statusMeta?.color || "default"}
                      variant={statusMeta ? "filled" : "outlined"}
                      label={getNotebookStatusLabel(draft.nb_status)}
                    />
                    <Chip
                      color="primary"
                      variant={draft.nb_action ? "filled" : "outlined"}
                      label={getNotebookActionLabel(draft.nb_action)}
                    />
                  </Stack>
                </SectionCard>

                <NotebookNoteField
                  title="บันทึกการพูดคุย"
                  description={noteDescription}
                  name="nb_additional_info"
                  value={draft.nb_additional_info}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="สรุปสิ่งที่คุย ความต้องการของลูกค้า และขั้นตอนถัดไปที่ตกลงร่วมกัน..."
                  resetKey={resetKey}
                  onDraftChange={(draftItem) =>
                    handlePendingDraftChange("nb_additional_info", draftItem)
                  }
                  inputRef={noteInputRef}
                  minRows={6}
                  readOnly={isViewMode}
                />

                <NotebookNoteField
                  title="บันทึกภายใน"
                  description={internalNoteDescription}
                  name="nb_remarks"
                  value={draft.nb_remarks}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="เพิ่มหมายเหตุภายใน ความเสี่ยง หรือสิ่งที่ต้องเตรียมสำหรับการติดตามครั้งถัดไป..."
                  resetKey={resetKey}
                  onDraftChange={(draftItem) => handlePendingDraftChange("nb_remarks", draftItem)}
                  minRows={4}
                  readOnly={isViewMode}
                />

                {historyLoading || visibleHistories.length > 0 || pendingDrafts.length > 0 ? (
                  <NotebookHistoryTimeline
                    histories={visibleHistories}
                    isLoading={historyLoading}
                    showAll={showHistory}
                    onToggle={() => setShowHistory((previous) => !previous)}
                    pendingDrafts={pendingDrafts}
                  />
                ) : null}
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack spacing={2.25}>
                <SectionCard>
                  <SectionHeading>
                    <MdBusiness />
                    ข้อมูลลูกค้า
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    เก็บข้อมูลติดต่อให้พร้อมใช้งาน โดยไม่รบกวนขั้นตอนหลักของการทำงาน
                  </Typography>

                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      label="ลูกค้า / ลีด"
                      name="nb_customer_name"
                      value={draft.nb_customer_name || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_customer_name}
                      helperText={errors.nb_customer_name}
                    />

                    <TextField
                      fullWidth
                      label="ผู้ติดต่อ"
                      name="nb_contact_person"
                      value={draft.nb_contact_person || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_contact_person}
                      helperText={errors.nb_contact_person}
                    />

                    <TextField
                      fullWidth
                      label="เบอร์โทร"
                      name="nb_contact_number"
                      value={draft.nb_contact_number || ""}
                      onChange={handleChange}
                      onBlur={(event) => {
                        if (isViewMode) {
                          return;
                        }

                        handleBlur(event);
                        checkPhoneDuplicate(event.target.value);
                      }}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_contact_number}
                      helperText={
                        errors.nb_contact_number || "ระบบจะตรวจสอบข้อมูลซ้ำหลังออกจากช่องนี้"
                      }
                    />

                    <TextField
                      fullWidth
                      label="อีเมล"
                      name="nb_email"
                      value={draft.nb_email || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      InputProps={{ readOnly: isViewMode }}
                      error={!!errors.nb_email}
                      helperText={errors.nb_email}
                    />
                  </Stack>
                </SectionCard>

                <SectionCard>
                  <SectionHeading>
                    <MdSupervisorAccount />
                    ผู้ดูแลและแหล่งที่มา
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    แสดงบริบทสำคัญให้เห็นชัด โดยไม่ดึงความสนใจจากงานถัดไป
                  </Typography>

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                        ผู้ดูแลการขาย
                      </Typography>

                      {isAdmin ? (
                        <FormControl fullWidth size="small">
                          <Select
                            name="nb_manage_by"
                            value={draft.nb_manage_by || ""}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            displayEmpty
                            disabled={isViewMode}
                          >
                            <MenuItem value="">
                              <em>เลือกผู้ดูแลการขาย</em>
                            </MenuItem>
                            {salesList.map((user) => (
                              <MenuItem key={user.user_id} value={user.user_id}>
                                {user.username || user.user_nickname || `ผู้ใช้ ${user.user_id}`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip color="default" variant="outlined" label={salesOwnerLabel} />
                      )}
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                        แหล่งที่มา
                      </Typography>

                      <ToggleButtonGroup
                        exclusive
                        value={draft.nb_is_online ? "online" : "onsite"}
                        onChange={(_, value) => {
                          if (!value) {
                            return;
                          }

                          handleOnlineToggle(value === "online");
                        }}
                        disabled={isViewMode}
                        sx={{ gap: 1 }}
                      >
                        <SourceToggleButton value="online">ออนไลน์</SourceToggleButton>
                        <SourceToggleButton value="onsite">ออนไซต์</SourceToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                      <Chip
                        variant="outlined"
                        label={getThaiSourceLabel(sourceMeta.label)}
                        color={sourceMeta.color}
                      />
                      <Chip
                        variant="outlined"
                        icon={
                          isViewMode ? <MdRemoveRedEye /> : isEditMode ? <MdEdit /> : <MdSave />
                        }
                        label={isViewMode ? "โหมดดู" : isEditMode ? "โหมดแก้ไข" : "โหมดสร้าง"}
                      />
                      {draft.nb_contact_number ? (
                        <Chip variant="outlined" label="พร้อมติดตามผ่านเบอร์โทร" />
                      ) : null}
                    </Stack>
                  </Stack>
                </SectionCard>

                <SectionCard>
                  <SectionHeading>
                    <MdNote />
                    สรุปภาพรวมงาน
                  </SectionHeading>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    สรุปสั้น ๆ เพื่อให้ประเด็นสำคัญไม่ถูกกลบด้วยบันทึกยาว
                  </Typography>

                  <Stack spacing={1.25}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        การดำเนินการ
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {getNotebookActionLabel(draft.nb_action)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        สถานะ
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {getNotebookStatusLabel(draft.nb_status)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        การบันทึก
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ปุ่มบันทึกจะแสดงด้านล่างบนเดสก์ท็อป และเป็นปุ่มลอยบนมือถือ
                      </Typography>
                    </Box>
                  </Stack>
                </SectionCard>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      {!isMobile && !isViewMode && (
        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
            bgcolor: "rgba(250,250,250,0.92)",
            borderTop: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(10px)",
            position: "sticky",
            bottom: 0,
            zIndex: 2,
          }}
        >
          <Button onClick={handleClose} color="inherit" size="large">
            {closeButtonLabel}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={<MdSave />}
            disabled={isSubmitting}
            size="large"
            sx={{
              px: 3.5,
              borderRadius: 999,
              textTransform: "none",
              fontSize: "1rem",
            }}
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      )}

      {!isMobile && isViewMode && (
        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
            bgcolor: "rgba(250,250,250,0.92)",
            borderTop: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(10px)",
            position: "sticky",
            bottom: 0,
            zIndex: 2,
          }}
        >
          <Button onClick={handleClose} color="primary" variant="contained" size="large">
            {closeButtonLabel}
          </Button>
        </DialogActions>
      )}

      {isMobile && dialogOpen && !isViewMode && (
        <Fab
          color="primary"
          variant="extended"
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: theme.zIndex.modal + 1,
            borderRadius: 999,
            px: 2.5,
          }}
        >
          <MdSave style={{ marginRight: 8 }} />
          {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
        </Fab>
      )}

      <DuplicatePhoneDialog
        open={duplicatePhoneDialogOpen}
        onClose={closeDuplicatePhoneDialog}
        duplicateData={duplicatePhoneData}
      />
    </Dialog>
  );
};

export default NotebookDialog;
