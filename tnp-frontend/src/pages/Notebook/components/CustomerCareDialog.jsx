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
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
  MdCalendarToday,
  MdEventAvailable,
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
  getNotebookEntryTypeLabel,
  getNotebookSourceTypeLabel,
  getNotebookStatusOption,
} from "../utils/notebookDialogConfig";

const SectionCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  fontSize: "0.875rem",
  fontWeight: 700,
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  marginBottom: theme.spacing(1.25),
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
  const salesOwnerLabel = getUserDisplayName(currentUser) || "Sales owner";
  const summaryTitle = draft.nb_customer_name?.trim() || "New customer care";

  const extraChips = useMemo(
    () => [
      {
        label: getNotebookEntryTypeLabel("customer_care"),
        color: "secondary",
        variant: "outlined",
      },
    ],
    []
  );

  const modeLabel = isViewMode
    ? "ดูข้อมูลดูแลลูกค้า"
    : isEditMode
      ? "แก้ไขดูแลลูกค้า"
      : "ดูแลลูกค้าใหม่";

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
              extraChips={extraChips}
              onClose={onClose}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Stack spacing={2}>
                  <SectionCard>
                    <SectionHeading>
                      <MdManageAccounts size={16} />
                      ข้อมูลลูกค้าที่ดูแล
                    </SectionHeading>

                    <Stack spacing={1.5}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
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
                          sx={{ minWidth: { sm: 160 }, textTransform: "none" }}
                        >
                          เลือกจากระบบ
                        </Button>
                      </Stack>

                      {!isCreateMode ? (
                        <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, py: 0.5 }}>
                          หลังบันทึกแล้ว source จะล็อก — สร้างรายการใหม่ถ้าต้องการเปลี่ยนลูกค้า
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

                      <Grid container spacing={1.25}>
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
                      <MdCalendarToday size={16} />
                      สถานะ
                    </SectionHeading>

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
                      sx={{ flexWrap: "wrap", gap: 0.75 }}
                    >
                      {NOTEBOOK_STATUS_OPTIONS.map((option) => (
                        <ToggleButton
                          key={option.value}
                          value={option.value}
                          sx={{ borderRadius: 999, px: 1.75, py: 0.5, textTransform: "none" }}
                        >
                          {option.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </SectionCard>

                  <NotebookNoteField
                    title="บันทึกการพูดคุย"
                    description="สรุปสิ่งที่คุยกับลูกค้าและขั้นตอนถัดไป"
                    name="nb_additional_info"
                    value={draft.nb_additional_info}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="สรุปการดูแลลูกค้าในครั้งนี้..."
                    resetKey={recordKey}
                    readOnly={isViewMode}
                  />

                  <NotebookNoteField
                    title="บันทึกภายใน"
                    description="สำหรับทีมภายใน เช่น ข้อควรระวัง หรือราคา"
                    name="nb_remarks"
                    value={draft.nb_remarks}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="บันทึกภายใน..."
                    resetKey={recordKey}
                    readOnly={isViewMode}
                  />

                  <SectionCard>
                    <SectionHeading>
                      <MdEventAvailable size={16} />
                      การติดตามครั้งถัดไป
                    </SectionHeading>
                    <Stack spacing={1.5}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
                        <DatePicker
                          value={
                            draft.nb_next_followup_date
                              ? new Date(draft.nb_next_followup_date)
                              : null
                          }
                          onChange={(newValue) =>
                            handleChange({
                              target: {
                                name: "nb_next_followup_date",
                                value: newValue ? format(newValue, "yyyy-MM-dd") : "",
                              },
                            })
                          }
                          format="dd MMMM yyyy"
                          readOnly={isViewMode}
                          disabled={isViewMode}
                          slotProps={{
                            textField: {
                              size: "small",
                              fullWidth: true,
                              helperText:
                                "เว้นว่างหากยังไม่กำหนด · ระบบจะเตือนในรายการเมื่อถึงกำหนด",
                            },
                            field: { clearable: !isViewMode },
                          }}
                        />
                      </LocalizationProvider>

                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        maxRows={5}
                        label="สิ่งที่ต้องทำครั้งหน้า"
                        placeholder="เช่น โทรสอบถามเรื่องใบเสนอราคา, ส่ง catalog เพิ่ม..."
                        name="nb_next_followup_note"
                        value={draft.nb_next_followup_note || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        InputProps={{ readOnly: isViewMode }}
                        disabled={isViewMode}
                      />
                    </Stack>
                  </SectionCard>
                </Stack>
              </Grid>

              <Grid item xs={12} md={5}>
                <Stack spacing={2}>
                  <NotebookHistoryTimeline
                    histories={notebookHistories}
                    isLoading={isNotebookDetailFetching}
                    showAll={showHistory}
                    onToggle={() => setShowHistory((previous) => !previous)}
                  />

                  <SectionCard>
                    <SectionHeading>
                      <MdSupervisorAccount size={16} />
                      ผู้ดูแลและแหล่งที่มา
                    </SectionHeading>

                    <Stack spacing={1.5}>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.25 }}
                        >
                          ผู้ดูแลการขาย
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {salesOwnerLabel}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          แหล่งที่มา
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ flexWrap: "wrap", rowGap: 0.75 }}
                        >
                          <Chip
                            size="small"
                            icon={<MdLink />}
                            label={getNotebookSourceTypeLabel(draft.nb_source_type)}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={draft.nb_is_online ? "Online" : "On-site"}
                            color={draft.nb_is_online ? "success" : "warning"}
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </SectionCard>
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
