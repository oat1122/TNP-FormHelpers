import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useMemo, useState } from "react";
import {
  MdCalendarToday,
  MdLink,
  MdManageAccounts,
  MdSave,
  MdSupervisorAccount,
} from "react-icons/md";

import CustomerCareSourcePickerDialog from "./CustomerCareSourcePickerDialog";
import NotebookHistoryTimeline from "./NotebookHistoryTimeline";
import NotebookNoteField from "./NotebookNoteField";
import NotebookQuickActions from "./NotebookQuickActions";
import NotebookSummaryBar from "./NotebookSummaryBar";
import { useCustomerCareForm } from "../hooks/useCustomerCareForm";
import {
  NOTEBOOK_STATUS_OPTIONS,
  getNotebookActionLabel,
  getNotebookEntryTypeLabel,
  getNotebookSourceMeta,
  getNotebookSourceTypeLabel,
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

const getUserDisplayName = (user) =>
  user?.username ||
  user?.user_nickname ||
  [user?.user_firstname, user?.user_lastname].filter(Boolean).join(" ") ||
  "";

const CustomerCareDialog = ({
  open,
  mode = "create",
  selectedRecord,
  currentUser = {},
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    draft,
    errors,
    recordKey,
    isSubmitting,
    isNotebookDetailFetching,
    notebookHistories,
    handleChange,
    handleBlur,
    handleSourceSelect,
    handleSubmit,
  } = useCustomerCareForm({
    open,
    mode,
    selectedRecord,
    onClose,
  });

  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";
  const statusMeta = getNotebookStatusOption(draft.nb_status);
  const sourceMeta = getNotebookSourceMeta(Boolean(draft.nb_is_online));
  const salesOwnerLabel = getUserDisplayName(currentUser) || "Sales owner";
  const summaryTitle = draft.nb_customer_name?.trim() || "New customer care";

  const extraChips = useMemo(
    () => [
      {
        label: getNotebookEntryTypeLabel("customer_care"),
        color: "secondary",
        variant: "filled",
      },
      {
        label: `Source: ${getNotebookSourceTypeLabel(draft.nb_source_type)}`,
      },
    ],
    [draft.nb_source_type]
  );

  const modeLabel = isViewMode
    ? "Customer care view"
    : isEditMode
      ? "Customer care update"
      : "New customer care";

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
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
              extraChips={extraChips}
              onClose={onClose}
            />

            <Grid container spacing={2.25}>
              <Grid item xs={12} md={7}>
                <Stack spacing={2.25}>
                  <SectionCard>
                    <SectionHeading>
                      <MdManageAccounts />
                      ข้อมูลลูกค้าที่ดูแล
                    </SectionHeading>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      เลือกข้อมูลจาก Customer หรือ Notebook แล้วระบบจะ snapshot มาเป็นข้อมูลอ่านอย่างเดียว
                    </Typography>

                    <Stack spacing={2}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="วันที่ดูแล"
                          name="nb_date"
                          value={draft.nb_date || ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{ readOnly: isViewMode }}
                          error={!!errors.nb_date}
                          helperText={errors.nb_date}
                        />
                        <Button
                          variant="outlined"
                          onClick={() => setPickerOpen(true)}
                          disabled={!isCreateMode || isViewMode}
                          sx={{ minWidth: { sm: 180 } }}
                        >
                          เลือกจากระบบ
                        </Button>
                      </Stack>

                      {!isCreateMode ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          หลังบันทึกแล้วจะล็อก source ไว้ ถ้าต้องการเปลี่ยนลูกค้าให้สร้างรายการใหม่
                        </Alert>
                      ) : null}

                      {errors.source ? (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                          {errors.source}
                        </Alert>
                      ) : null}

                      <TextField
                        fullWidth
                        size="small"
                        label="ลูกค้า / บริษัท"
                        name="nb_customer_name"
                        value={draft.nb_customer_name || ""}
                        InputProps={{ readOnly: true }}
                        error={!!errors.nb_customer_name}
                        helperText={errors.nb_customer_name}
                      />

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ผู้ติดต่อ"
                            name="nb_contact_person"
                            value={draft.nb_contact_person || ""}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="โทรศัพท์"
                            name="nb_contact_number"
                            value={draft.nb_contact_number || ""}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            size="small"
                            label="อีเมล"
                            name="nb_email"
                            value={draft.nb_email || ""}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </SectionCard>

                  <NotebookQuickActions
                    value={draft.nb_action}
                    onChange={(value) =>
                      handleChange({
                        target: {
                          name: "nb_action",
                          value,
                        },
                      })
                    }
                    readOnly={isViewMode}
                  />

                  <SectionCard>
                    <SectionHeading>
                      <MdCalendarToday />
                      Status
                    </SectionHeading>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      อัปเดตสถานะและมุมมองของงานที่กำลังดูแลให้เห็นตรงกัน
                    </Typography>

                    <Stack spacing={1.5}>
                      <ToggleButtonGroup
                        exclusive
                        value={draft.nb_status || null}
                        onChange={(_, value) => {
                          if (!value || isViewMode) {
                            return;
                          }

                          handleChange({
                            target: {
                              name: "nb_status",
                              value,
                            },
                          });
                        }}
                        disabled={isViewMode}
                        sx={{ flexWrap: "wrap", gap: 1 }}
                      >
                        {NOTEBOOK_STATUS_OPTIONS.map((option) => (
                          <ToggleButton
                            key={option.value}
                            value={option.value}
                            sx={{ borderRadius: 999, px: 2, textTransform: "none" }}
                          >
                            {option.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>

                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
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
                    </Stack>
                  </SectionCard>

                  <NotebookNoteField
                    title="Interaction notes"
                    description="บันทึกสิ่งที่คุยกับลูกค้า ความต้องการ หรือ next step ที่ตกลงกัน"
                    name="nb_additional_info"
                    value={draft.nb_additional_info}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="สรุปการดูแลลูกค้าในครั้งนี้..."
                    resetKey={recordKey}
                    readOnly={isViewMode}
                  />

                  <NotebookNoteField
                    title="Internal notes"
                    description="บันทึกภายในสำหรับทีมขาย เช่น ความเสี่ยง ราคา หรือข้อควรระวัง"
                    name="nb_remarks"
                    value={draft.nb_remarks}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="บันทึกภายใน..."
                    resetKey={recordKey}
                    readOnly={isViewMode}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={5}>
                <Stack spacing={2.25}>
                  <SectionCard>
                    <SectionHeading>
                      <MdSupervisorAccount />
                      Source summary
                    </SectionHeading>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      ตรวจสอบ owner, source และข้อมูล snapshot ที่ใช้สร้างรายการนี้
                    </Typography>

                    <Stack spacing={1.25}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Sales owner
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {salesOwnerLabel}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Source type
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap", rowGap: 1 }}>
                          <Chip
                            icon={<MdLink />}
                            label={getNotebookSourceTypeLabel(draft.nb_source_type)}
                            variant="outlined"
                          />
                          <Chip
                            label={draft.nb_is_online ? "Online" : "On-site"}
                            color={draft.nb_is_online ? "success" : "warning"}
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Snapshot
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          ระบบจะเก็บข้อมูลลูกค้าจากแหล่งที่เลือกไว้ในรายการนี้เพื่อใช้แสดงผลและ export รายงาน
                        </Typography>
                      </Box>
                    </Stack>
                  </SectionCard>

                  <NotebookHistoryTimeline
                    histories={notebookHistories}
                    isLoading={isNotebookDetailFetching}
                    showAll={showHistory}
                    onToggle={() => setShowHistory((previous) => !previous)}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        {!isMobile && !isViewMode ? (
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
            <Button onClick={onClose} color="inherit" size="large">
              Cancel
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
              {isSubmitting ? "Saving..." : "Save customer care"}
            </Button>
          </DialogActions>
        ) : null}

        {!isMobile && isViewMode ? (
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
            <Button onClick={onClose} color="primary" variant="contained" size="large">
              Close
            </Button>
          </DialogActions>
        ) : null}

        {isMobile && open && !isViewMode ? (
          <Button
            variant="contained"
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
            {isSubmitting ? "Saving..." : "Save customer care"}
          </Button>
        ) : null}
      </Dialog>

      <CustomerCareSourcePickerDialog
        open={pickerOpen}
        defaultSource={draft.nb_source_type || "customer"}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          handleSourceSelect(item);
          setPickerOpen(false);
        }}
      />
    </>
  );
};

export default CustomerCareDialog;
